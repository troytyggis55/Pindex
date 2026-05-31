import { View, Text } from 'react-native'

export type TradeStatusBadgeProps = {
  status: string
}

/** Confirmed / Unconfirmed status pill shared across trade surfaces. */
export function TradeStatusBadge({ status }: TradeStatusBadgeProps) {
  const isUnconfirmed = status === 'unconfirmed'
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: isUnconfirmed ? '#fef3c7' : '#dcfce7',
      }}
    >
      <Text
        className="font-monda-bold text-[11px]"
        style={{ color: isUnconfirmed ? '#92400e' : '#166534' }}
      >
        {isUnconfirmed ? 'Unconfirmed' : 'Confirmed'}
      </Text>
    </View>
  )
}
