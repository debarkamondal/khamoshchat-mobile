import * as React from 'react';

import { LibsignalDezireViewProps } from './LibsignalDezire.types';

export default function LibsignalDezireView(props: LibsignalDezireViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
