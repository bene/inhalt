import type { RealtimeMessage } from "@inhalt/schema";

let webSocket: WebSocket | null = null;

function connect() {
  webSocket = new WebSocket("ws://localhost:3000/realtime?kind=client");

  webSocket.onopen = () => {
    console.log("Connected");
  };

  webSocket.onmessage = (event) => {
    console.log(`Message from server: ${event.data}`);
  };

  webSocket.onclose = () => {
    setTimeout(connect, 1000);
  };
}

connect();

export function send(msg: RealtimeMessage) {
  if (webSocket) {
    webSocket.send(JSON.stringify(msg));
  }
}
