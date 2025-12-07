import { requireNativeView } from 'expo';
import * as React from 'react';

import { LibsignalDezireViewProps } from './LibsignalDezire.types';

const NativeView: React.ComponentType<LibsignalDezireViewProps> =
  requireNativeView('LibsignalDezire');

export default function LibsignalDezireView(props: LibsignalDezireViewProps) {
  return <NativeView {...props} />;
}
