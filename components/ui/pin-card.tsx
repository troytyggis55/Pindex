import { TouchableOpacity, View, Text, Image } from "react-native";
import { Colors } from "@/constants/theme";
import Color from "colorjs.io"

interface PinCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  orgColor?: string | null;
  orgLogoUrl?: string | null; // unused — kept for call-site compatibility
  isConfirmed?: boolean;
  index?: number | null; // kept for call-site compatibility
  flags?: Record<string, boolean>; // kept for call-site compatibility
  onPress?: () => void;
  hideName?: boolean; // hide the name label (e.g. in overlapping stacks)
  hideBorder?: boolean;
  size?: PinCardSize; // circle size (default 'medium')
}

type PinCardSize = "small" | "medium" | "large";

/** Circle diameter in px for each size. */
const SIZES: Record<PinCardSize, number> = {
  small: 30,
  medium: 76,
  large: 100,
};

const SHADOW_SPACE = 0;

export function PinCard({
  name,
  imageUrl,
  orgColor,
  isConfirmed = true,
  onPress,
  hideName = false,
  hideBorder = false,
  size = "medium",
}: PinCardProps) {
  const CIRCLE_SIZE = SIZES[size];
  
  const borderColor = isConfirmed
    ? (orgColor ?? Colors.orgFallback)
    : "#9CA3AF";
  
  // Calculate text color for contrast against border color using APCA.
  const bg = new Color(borderColor);
  const onBlack = Math.abs(bg.contrast("black", "APCA"));
  const onWhite = Math.abs(bg.contrast("white", "APCA"));
  const textColor = onWhite >= onBlack ? "white" : "black";


  const styleClass = size === "medium" ? "p-[4px] border-3" : "p-0 border-2";
  const letterStyle = size === "medium" ? "text-[26px]" : "text-[14px]";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="items-center"
    >
      <View
        style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE + SHADOW_SPACE }}
        className="items-center"
      >
        {!hideBorder && (
          <View
            className="absolute bottom-0 w-12 h-0 rounded"
            style={
              {
                //boxShadow: `0px 0px 20px 10px #00000066`,
              }
            }
          />
        )}

        {/* Outer ring: colored border with padding so it sits off the image */}
        <View
          className={`items-center justify-center shadow-md ${styleClass}`}
          style={{
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            borderColor: borderColor,
          }}
        >
          {/* Inner view clips image to circle */}
          <View
            className="overflow-hidden items-center justify-center flex-1 w-full"
            style={{
              borderRadius: CIRCLE_SIZE / 2,
              backgroundColor: borderColor,
            }}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text
                className={`font-monda-bold ${letterStyle}`}
                style={{ color: textColor }}
              >
                {name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </View>
      </View>

      {name && !hideName && (
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
  );
}
