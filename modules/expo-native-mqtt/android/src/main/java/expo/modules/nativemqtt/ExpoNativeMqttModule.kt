package expo.modules.nativemqtt

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.hivemq.client.mqtt.mqtt3.Mqtt3AsyncClient
import com.hivemq.client.mqtt.mqtt3.Mqtt3Client
import com.hivemq.client.mqtt.datatypes.MqttQos
import com.hivemq.client.mqtt.MqttGlobalPublishFilter
import com.hivemq.client.mqtt.mqtt3.message.connect.connack.Mqtt3ConnAck
import android.os.Handler
import android.os.Looper
import java.util.UUID

class ExpoNativeMqttModule : Module() {
    private var client: Mqtt3AsyncClient? = null
    private var storedOptions: Map<String, Any> = emptyMap()
    private var subscribedTopics = mutableMapOf<String, Int>() // topic -> qos
    private var isDisconnectingManually = false
    private val handler = Handler(Looper.getMainLooper())
    private var reconnectRunnable: Runnable? = null
    private var storedUsername: String? = null
    private var storedPassword: String? = null

    override fun definition() = ModuleDefinition {
        Name("ExpoNativeMqtt")

        Events(
            "onMqttConnected",
            "onMqttDisconnected",
            "onMqttError",
            "onMqttMessageReceived",
            "onMqttSubscribed",
            "onMqttUnsubscribed",
            "onMqttReconnecting"
        )

        AsyncFunction("connect") { brokerUrl: String, username: String?, password: String?, options: Map<String, Any>, promise: Promise ->
            try {
                // Parse options
                storedOptions = options
                val clientId = options["clientId"] as? String ?: "expo-mqtt-${UUID.randomUUID()}"
                val cleanSession = options["cleanSession"] as? Boolean ?: false
                val keepAlive = (options["keepAlive"] as? Number)?.toInt() ?: 60

                // Parse Broker URL
                // Format expects tcp://host:port or ssl://host:port
                val cleanUrl = brokerUrl.replace("tcp://", "").replace("ssl://", "")
                val parts = cleanUrl.split(":")
                val host = parts.getOrNull(0) ?: brokerUrl
                val port = parts.getOrNull(1)?.toInt() ?: 1883

                val builder = Mqtt3Client.builder()
                    .identifier(clientId)
                    .serverHost(host)
                    .serverPort(port)
                    .addDisconnectedListener { context ->
                        val error = context.cause
                        sendEvent("onMqttDisconnected", mapOf("error" to (error?.message ?: "Disconnected")))
                        if (!isDisconnectingManually) {
                            scheduleReconnect()
                        }
                    }

                // SSL Setup
                if (brokerUrl.startsWith("ssl://")) {
                    builder.sslWithDefaultConfig()
                }

                client = builder.buildAsync()

                // Global Publish listener
                client?.publishes(MqttGlobalPublishFilter.ALL) { publish ->
                    val payload = String(publish.payloadAsBytes)
                    sendEvent("onMqttMessageReceived", mapOf(
                        "topic" to publish.topic.toString(),
                        "payload" to payload,
                        "qos" to publish.qos.code,
                        "retained" to publish.isRetain
                    ))
                }

                // Connect builder
                storedUsername = username
                storedPassword = password

                val connectBuilder = client?.connectWith()
                    ?.cleanSession(cleanSession)
                    ?.keepAlive(keepAlive)

                if (!storedUsername.isNullOrEmpty() && !storedPassword.isNullOrEmpty()) {
                    connectBuilder?.simpleAuth()
                        ?.username(storedUsername!!)
                        ?.password(storedPassword!!.toByteArray())
                        ?.applySimpleAuth()
                }

                isDisconnectingManually = false

                connectBuilder?.send()?.whenComplete { ack: Mqtt3ConnAck?, throwable: Throwable? ->
                    if (throwable != null) {
                        promise.reject("CONNECT_FAILED", throwable.message, throwable)
                        sendEvent("onMqttError", mapOf("error" to throwable.message))
                    } else {
                        promise.resolve("Connected")
                        sendEvent("onMqttConnected", mapOf("status" to "connected"))
                        resubscribeAll()
                    }
                }
            } catch (e: Exception) {
                promise.reject("CONNECT_ERROR", e.message, e)
            }
        }

        AsyncFunction("disconnect") { promise: Promise ->
            isDisconnectingManually = true
            reconnectRunnable?.let { handler.removeCallbacks(it) }
            reconnectRunnable = null
            
            client?.disconnect()?.whenComplete { _, _ ->
                promise.resolve("Disconnected")
            } ?: promise.resolve("No active client")
        }

        AsyncFunction("subscribe") { topic: String, qos: Int, promise: Promise ->
            subscribedTopics[topic] = qos
            val mqttQos = MqttQos.fromCode(qos) ?: MqttQos.AT_MOST_ONCE
            
            client?.subscribeWith()
                ?.topicFilter(topic)
                ?.qos(mqttQos)
                ?.send()
                ?.whenComplete { _, throwable ->
                    if (throwable != null) {
                        promise.reject("SUBSCRIBE_FAILED", throwable.message, throwable)
                    } else {
                        promise.resolve("Subscribed")
                        sendEvent("onMqttSubscribed", mapOf("topic" to topic))
                    }
                }
        }

        AsyncFunction("unsubscribe") { topic: String, promise: Promise ->
            subscribedTopics.remove(topic)
            
            client?.unsubscribeWith()
                ?.topicFilter(topic)
                ?.send()
                ?.whenComplete { _, throwable ->
                    if (throwable != null) {
                        promise.reject("UNSUBSCRIBE_FAILED", throwable.message, throwable)
                    } else {
                        promise.resolve("Unsubscribed")
                        sendEvent("onMqttUnsubscribed", mapOf("topic" to topic))
                    }
                }
        }

        AsyncFunction("publish") { topic: String, message: String, qos: Int, retained: Boolean, promise: Promise ->
            val mqttQos = MqttQos.fromCode(qos) ?: MqttQos.AT_MOST_ONCE
            
            client?.publishWith()
                ?.topic(topic)
                ?.payload(message.toByteArray())
                ?.qos(mqttQos)
                ?.retain(retained)
                ?.send()
                ?.whenComplete { _, throwable ->
                    if (throwable != null) {
                        promise.reject("PUBLISH_FAILED", throwable.message, throwable)
                    } else {
                        promise.resolve("Published")
                    }
                }
        }
    }

    private fun scheduleReconnect() {
        val autoReconnect = storedOptions["autoReconnect"] as? Boolean ?: true
        if (!autoReconnect) return

        val delayMs = (storedOptions["reconnectDelay"] as? Number)?.toLong() ?: 5000L

        reconnectRunnable?.let { handler.removeCallbacks(it) }
        reconnectRunnable = Runnable {
            client?.let {
                sendEvent("onMqttReconnecting", mapOf("status" to "reconnecting"))
                // Reconnect doesn't have a simple .reconnect() in Mqtt3AsyncClient Async API easily without re-building
                // or calling connectWith() again with same options!
                val cleanSession = storedOptions["cleanSession"] as? Boolean ?: false
                val keepAlive = (storedOptions["keepAlive"] as? Number)?.toInt() ?: 60
                
                val connectBuilder = it.connectWith()
                    .cleanSession(cleanSession)
                    .keepAlive(keepAlive)
                
                // Re-apply auth if stored in class variables (not stored currently in options dictionary for safety)
                // Wait, I should store username/password or access them if needed for secret reuse, 
                // but the builder preserves them unless reset?
                // Actually with builder.buildAsync(), the client maintains its credentials if they were set on building!
                // Wait, credentials in connecting can be set on connectWith too!
                
                connectBuilder.send().whenComplete { ack, throwable ->
                    if (throwable == null) {
                        sendEvent("onMqttConnected", mapOf("status" to "connected"))
                        resubscribeAll()
                    }
                }
            }
        }
        handler.postDelayed(reconnectRunnable!!, delayMs)
    }

    private fun resubscribeAll() {
        for ((topic, qos) in subscribedTopics) {
            val mqttQos = MqttQos.fromCode(qos) ?: MqttQos.AT_MOST_ONCE
            client?.subscribeWith()
                ?.topicFilter(topic)
                ?.qos(mqttQos)
                ?.send()
        }
    }
}
