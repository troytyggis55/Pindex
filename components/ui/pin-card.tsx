import { TouchableOpacity, View, Text, Image } from 'react-native'
import { Colors } from '@/constants/theme'

interface PinCardProps {
    id: string
    name: string
    imageUrl?: string | null
    orgColor?: string | null
    orgLogoUrl?: string | null  // unused — kept for call-site compatibility
    isConfirmed?: boolean
    index?: number | null       // kept for call-site compatibility
    flags?: Record<string, boolean>  // kept for call-site compatibility
    onPress?: () => void
    hideName?: boolean  // kept for call-site compatibility
}

const CIRCLE_SIZE = 76
const SHADOW_SPACE = 0

export function PinCard({
    name,
    imageUrl,
    orgColor,
    isConfirmed = true,
    onPress,
}: PinCardProps) {
    const shadowColor = isConfirmed ? (orgColor ?? Colors.orgFallback) : '#9CA3AF'

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="items-center">
            <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE + SHADOW_SPACE }} className="items-center">
                {/* Elliptical glow shadow — rendered first so circle sits on top */}
                <View
                    className="absolute bottom-0 w-12 h-0 rounded"
                    style={{
                        backgroundColor: shadowColor,
                        boxShadow: `0px 0px 20px 10px ${shadowColor}`,
                    }}
                />

                {/* Inner view clips image to circle */}
                <View
                    className="border overflow-hidden items-center justify-center bg-white"
                    style={{
                        width: CIRCLE_SIZE,
                        height: CIRCLE_SIZE,
                        borderRadius: CIRCLE_SIZE / 2,
                    }}
                >
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text className="font-monda-bold text-[26px] text-black">
                            {name.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
            </View>

            {name && (
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="mt-1.5 font-monda-bold text-[11px] text-deep-black text-center"
                    style={{ width: CIRCLE_SIZE + 40 }}
                >
                    {name}
                </Text>
            )}
        </TouchableOpacity>
    )
}
