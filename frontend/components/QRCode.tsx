import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeComponentProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

export default function QRCodeComponent({
  value,
  size = 200,
  backgroundColor = 'white',
  color = 'black',
}: QRCodeComponentProps) {
  return (
    <View className="items-center justify-center">
      <QRCode
        value={value}
        size={size}
        backgroundColor={backgroundColor}
        color={color}
      />
    </View>
  );
}

