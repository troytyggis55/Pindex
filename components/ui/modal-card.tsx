import { Dimensions, KeyboardAvoidingView, Modal, Platform, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ReactNode } from 'react'

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75

export interface ModalCardProps {
  visible: boolean
  onClose: () => void
  children: ReactNode
}

export function ModalCard({ visible, onClose, children }: ModalCardProps) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View
          className="bg-off-white rounded-t-3xl mx-6 overflow-hidden"
          style={{ height: SHEET_HEIGHT, paddingBottom: insets.bottom + 12 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {children}
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  )
}
