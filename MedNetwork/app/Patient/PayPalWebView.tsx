// PayPalWebView.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface PayPalWebViewProps {
  visible: boolean;
  onClose: () => void;
  amount: string;
  onSuccess: (details: any) => void;
}

// Web-specific implementation
const PayPalWebViewWeb: React.FC<PayPalWebViewProps> = ({ visible, onClose, amount, onSuccess }) => {
  if (!visible) return null;

  const clientID = 'AQQxhUNPnAgxCt2hQxvPX2sJYmUnkbGzistmWjo4b3bkbQdffGFqwoWR0_roGn39eHPjuxWlffof3xIA';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <iframe
          srcDoc={`
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://www.paypal.com/sdk/js?client-id=${clientID}&currency=USD"></script>
                <style>
                  body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                  #paypal-button-container { width: 100%; max-width: 400px; }
                </style>
              </head>
              <body>
                <div id="paypal-button-container"></div>
                <script>
                  function sendMessage(status, data) {
                    window.parent.postMessage({ status, data }, '*');
                  }
                  paypal.Buttons({
                    createOrder: function(data, actions) {
                      return actions.order.create({
                        purchase_units: [{
                          amount: {
                            value: '${amount}'
                          }
                        }]
                      });
                    },
                    onApprove: function(data, actions) {
                      return actions.order.capture().then(function(details) {
                        sendMessage('success', details);
                      });
                    },
                    onCancel: function(data) {
                      sendMessage('cancelled');
                    },
                    onError: function(err) {
                      sendMessage('error', err);
                    }
                  }).render('#paypal-button-container');
                </script>
              </body>
            </html>
          `}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={() => {
            window.addEventListener('message', (event) => {
              if (event.data.status === 'success') {
                onSuccess(event.data.data);
              } else if (event.data.status === 'cancelled') {
                onClose();
              }
            });
          }}
        />
      </View>
    </Modal>
  );
};

// Native implementation
const PayPalWebViewNative: React.FC<PayPalWebViewProps> = ({ visible, onClose, amount, onSuccess }) => {
  const clientID = 'AQQxhUNPnAgxCt2hQxvPX2sJYmUnkbGzistmWjo4b3bkbQdffGFqwoWR0_roGn39eHPjuxWlffof3xIA';

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://www.sandbox.paypal.com/sdk/js?client-id=${clientID}&currency=USD&disable-funding=credit,card"></script>
        <style>
          body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          #paypal-button-container { width: 100%; max-width: 400px; }
        </style>
      </head>
      <body>
        <div id="paypal-button-container"></div>
        <script>
          function sendMessage(status, data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status, data }));
          }
          paypal.Buttons({
            createOrder: function(data, actions) {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: '${amount}'
                  }
                }]
              });
            },
            onApprove: function(data, actions) {
              return actions.order.capture().then(function(details) {
                sendMessage('success', details);
              });
            },
            onCancel: function(data) {
              sendMessage('cancelled');
            },
            onError: function(err) {
              sendMessage('error', err);
            }
          }).render('#paypal-button-container');
        </script>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          javaScriptEnabled={true}
          startInLoadingState={true}
          renderLoading={() => <ActivityIndicator size="large" color="#0000ff" />}
          onMessage={(event) => {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.status === 'success') {
              onSuccess(message.data);
            } else if (message.status === 'cancelled') {
              onClose();
            }
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40
  }
});

// Export the appropriate component based on platform
const PayPalWebView = Platform.select({
  web: PayPalWebViewWeb,
  default: PayPalWebViewNative
}) as React.FC<PayPalWebViewProps>;

export default PayPalWebView;