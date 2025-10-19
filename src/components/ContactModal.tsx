import { Modal } from "react-native";
import StyledText from "./StyledText";

export default function ContactModal({
  isVisible,
  setIsVisible,
}: {
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
}) {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => setIsVisible(false)}
    >
      <StyledText>This is a modal</StyledText>
    </Modal>
  );
}
