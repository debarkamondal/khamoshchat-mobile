import ExpoModulesCore
import CocoaMQTT

public class ExpoNativeMqttModule: Module {
  private var mqtt: CocoaMQTT?
  private var storedOptions: [String: Any] = [:]
  private var subscribedTopics: [String: Int] = [:] // topic -> qos
  private var reconnectTimer: Timer?
  private var isDisconnectingManually = false

  public func definition() -> ModuleDefinition {
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

    AsyncFunction("connect") { (brokerUrl: String, username: String?, password: String?, options: [String: Any], promise: Promise) in
      guard let url = URL(string: brokerUrl) else {
        promise.reject("INVALID_URL", "Invalid broker URL")
        return
      }

      let host = url.host ?? brokerUrl
      let port = UInt16(url.port ?? 1883)
      
      self.storedOptions = options
      let clientId = options["clientId"] as? String ?? "expo-mqtt-\(UUID().uuidString)"
      let cleanSession = options["cleanSession"] as? Bool ?? false
      let keepAlive = options["keepAlive"] as? UInt16 ?? 60

      self.mqtt = CocoaMQTT(clientID: clientId, host: host, port: port)
      self.mqtt?.username = username
      self.mqtt?.password = password
      self.mqtt?.keepAlive = keepAlive
      self.mqtt?.cleanSession = cleanSession
      self.mqtt?.delegate = self

      // SSL Setup
      if brokerUrl.hasPrefix("ssl://") || brokerUrl.hasPrefix("wss://") {
        self.mqtt?.enableSSL = true
        self.mqtt?.allowUntrustCACert = true // match standard RN-Mqtt-Client behavior
      }

      self.isDisconnectingManually = false
      let success = self.mqtt?.connect() ?? false
      
      if success {
        promise.resolve("Connecting")
      } else {
        promise.reject("CONNECT_FAILED", "Failed into initiate connection")
      }
    }

    AsyncFunction("disconnect") { (promise: Promise) in
      self.isDisconnectingManually = true
      self.reconnectTimer?.invalidate()
      self.reconnectTimer = nil
      self.mqtt?.disconnect()
      promise.resolve("Disconnected")
    }

    AsyncFunction("subscribe") { (topic: String, qos: Int, promise: Promise) in
      self.subscribedTopics[topic] = qos
      let cocoaQos = CocoaMQTTQoS(rawValue: UInt8(qos)) ?? .qos0
      self.mqtt?.subscribe(topic, qos: cocoaQos)
      promise.resolve("Subscribed")
    }

    AsyncFunction("unsubscribe") { (topic: String, promise: Promise) in
      self.subscribedTopics.removeValue(forKey: topic)
      self.mqtt?.unsubscribe(topic)
      promise.resolve("Unsubscribed")
    }

    AsyncFunction("publish") { (topic: String, message: String, qos: Int, retained: Bool, promise: Promise) in
      let cocoaQos = CocoaMQTTQoS(rawValue: UInt8(qos)) ?? .qos1
      self.mqtt?.publish(topic, withString: message, qos: cocoaQos, retained: retained)
      promise.resolve("Published")
    }
  }

  fileprivate func scheduleReconnect() {
    guard !isDisconnectingManually else { return }
    let autoReconnect = storedOptions["autoReconnect"] as? Bool ?? true
    guard autoReconnect else { return }

    let delayMs = storedOptions["reconnectDelay"] as? Double ?? 5000.0
    let delaySeconds = delayMs / 1000.0

    DispatchQueue.main.async {
      self.reconnectTimer?.invalidate()
      self.reconnectTimer = Timer.scheduledTimer(withTimeInterval: delaySeconds, repeats: false) { [weak self] _ in
        guard let self = self else { return }
        self.sendEvent("onMqttReconnecting", ["status": "reconnecting"])
        _ = self.mqtt?.connect()
      }
    }
  }

  fileprivate func resubscribeAll() {
    for (topic, qos) in subscribedTopics {
      let cocoaQos = CocoaMQTTQoS(rawValue: UInt8(qos)) ?? .qos0
      mqtt?.subscribe(topic, qos: cocoaQos)
    }
  }
}

extension ExpoNativeMqttModule: CocoaMQTTDelegate {
  public func mqtt(_ mqtt: CocoaMQTT, didConnectAck ack: CocoaMQTTConnAck) {
    if ack == .accept {
      sendEvent("onMqttConnected", ["status": "connected"])
      resubscribeAll()
    } else {
      sendEvent("onMqttError", ["error": "Connection refused: \(ack)"])
    }
  }

  public func mqtt(_ mqtt: CocoaMQTT, didDisconnectWithError error: Error?) {
    sendEvent("onMqttDisconnected", [
      "error": error?.localizedDescription ?? "clean disconnect"
    ])
    scheduleReconnect()
  }

  public func mqtt(_ mqtt: CocoaMQTT, didReceiveMessage message: CocoaMQTTMessage, id: UInt16) {
    sendEvent("onMqttMessageReceived", [
      "topic": message.topic,
      "payload": message.string ?? "",
      "qos": Int(message.qos.rawValue),
      "retained": message.retained
    ])
  }

  public func mqtt(_ mqtt: CocoaMQTT, didSubscribeToTopic topics: [String], id: UInt16) {
    sendEvent("onMqttSubscribed", ["topics": topics])
  }

  public func mqtt(_ mqtt: CocoaMQTT, didUnsubscribeFromTopic topic: String) {
    sendEvent("onMqttUnsubscribed", ["topic": topic])
  }

  public func mqtt(_ mqtt: CocoaMQTT, didPublishMessage message: CocoaMQTTMessage, id: UInt16) {
    // Optional: could emit event, but AsyncFunction resolves immediately
  }

  public func mqtt(_ mqtt: CocoaMQTT, didPublishAck id: UInt16) { }

  public func mqtt(_ mqtt: CocoaMQTT, didSubscribeToTopics topics: [String], id: UInt16) { }

  public func mqttOneMinute(_ mqtt: CocoaMQTT) { }
}
