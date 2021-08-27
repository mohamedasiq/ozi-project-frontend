import "./message.css";
import { format } from "timeago.js";
import { useEffect } from "react";

export default function Message({ message, own }) {

  useEffect(() => {
    console.log("Messsage " + message + own)
  },[])

  return (
    <div className={own ? "message own" : "message"}>
      <div className="messageTop">
        <p className="messageText">{message.text}</p>
      </div>
      <span style={{fontSize: "10px"}}>{own ? "You" : message.senderName}</span>
      <div className="messageBottom">{format(message.createdAt)}</div>
    </div>
  );
}
