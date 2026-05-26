import { TouchableOpacity, View, Text, Image } from 'react-native'

interface PinCardProps {
    id: string
    name?: string
    imageUrl?: string | null
    orgName: string
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

// Deterministically maps an org name to a vivid HSV(hue, 1, 1) hex color
function orgNameToColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0
    }
    const hue = Math.abs(hash) % 360
    const h = hue / 60
    const x = 1 - Math.abs(h % 2 - 1)
    let r = 0, g = 0, b = 0
    if (h < 1)      { r = 1; g = x }
    else if (h < 2) { r = x; g = 1 }
    else if (h < 3) { g = 1; b = x }
    else if (h < 4) { g = x; b = 1 }
    else if (h < 5) { r = x; b = 1 }
    else            { r = 1; b = x }
    const hex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
    return `#${hex(r)}${hex(g)}${hex(b)}`
}

export function PinCard({
    name,
    imageUrl,
    orgName,
    orgColor,
    isConfirmed = true,
    onPress,
}: PinCardProps) {
    const shadowColor = isConfirmed ? (orgColor ?? orgNameToColor(orgName)) : '#9CA3AF'

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
                            {orgName.charAt(0).toUpperCase()}
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
