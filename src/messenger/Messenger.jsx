import "./messenger.css";
import React from "react"
import Conversation from "../conversations/Conversation";
import Group from "../groups/groups";
import Message from "../message/Message";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";
import { Tabs, Tab } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Messenger() {
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socket = useRef();
  const { user } = useContext(AuthContext);
  const scrollRef = useRef();
  const [roomsList, setRoomsList] = useState([]);
  const [friends,setFriends] = useState([])
  const [tab,setTab] = useState(0)
  const [bg, changeBGColor] = React.useState(0);
  const [bgg, changeBGGColor] = React.useState(0);

  const groupArr = [ "javascript", "java", "php"]

  const [key, setKey] = useState('friends');

  useEffect(() => {
    socket.current = io("ws://localhost:8900");
    socket.current.on("getMessage", (data) => {
      console.log("Getted Message " + data)
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      });
    });
  }, []);

  useEffect(() => {
    arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.sender) &&
      setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage, currentChat]);

  useEffect(() => {
    socket.current.emit("addUser", user._id);
    socket.current.on("getUsers", (users) => {
      console.log("Online Users " + JSON.stringify(users))
      setOnlineUsers(
        users.map((f) => f.userId)
      );
    });
  }, [user]);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get("/conversations/" + user._id);
        setConversations(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getConversations();
  }, [user._id]);

  useEffect(() => {
    const getRoomsList = async () => {
      try {
        const res = await axios.get("/rooms/");
        console.log("RoomsList " + res.data)
        setRoomsList(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getRoomsList();
  },[])

  useEffect(async() => {
    const res = await axios.get("/users/friends/" + user._id);
    console.log("All friends " + JSON.stringify(res.data))
    setFriends(res.data)
  },[])

  useEffect(() => {

    // Get room and users
    socket.current.on('roomUsers', ({ room, users }) => {
    });

    // Message from server
    socket.current.on('message', (message) => {
      console.log("message " + JSON.stringify(message));
      if(message.text.sender != user._id )
      {
        console.log("Entered message area")
        var rand = (Math.random() + 1).toString(36).substring(7)
        console.log("Randommm " + rand)
        var msg = {
          "roomId": message.text.roomId,
          "sender": message.username,
          "text": (message.text !== undefined && typeof(message.text) != 'object') ? message.text : message.text.text ,
           "_id": rand,
           "senderName":message.text.senderName
        }
        setMessages((prev) => [...prev, msg]);
        console.log(message.text)
        console.log(msg)
        console.log(messages)
      }
    });

  },[])

  const handleFriendConv = async(c,index) => {
    setMessages([])
    changeBGColor(index)
    var conv = {
      senderId: user._id,
      receiverId: c._id
    }
    const res = await axios.post("/conversations",conv);
    console.log("FriendConv " + JSON.stringify(res.data))
    setCurrentChat(res.data)
    setTab((prev) => 1)
    const resMsg = await axios.get("/messages/conversations/" + res.data._id);
    if(resMsg.data !== null && resMsg.data !== undefined && resMsg.data.length > 0)
    {
      console.log("FriendConv " + JSON.stringify(resMsg.data))
      console.log("Friend Messages " + JSON.stringify(resMsg.data))
      setMessages((prev) => resMsg.data);
      console.log("Friend Messages " + JSON.stringify(messages))
    }
    if(resMsg.data.length == 0)
    {
      setMessages([])
    }
  }

  const handleGroup = async(c,index) => {
    setMessages([])
    changeBGGColor(index)
    console.log("Joined Room " + c)
    setCurrentChat(c)
    var room = c._id
    socket.current.emit('joinRoom', { user : user.username, room : room });
    setTab((prev) => 2)
    const pushmem = await axios.post("/rooms/addmembers/",{
        roomId: c._id,
        userId: user._id
    });
    const res = await axios.get("/messages/roomId/" + c._id);
    if(res.data !== null && res.data !== undefined && res.data.length > 0)
    {
    console.log("Room chacha")
    console.log("Room Messages " + JSON.stringify(res.data))
    setMessages((prev) => res.data);
    console.log("Room Messages " + JSON.stringify(messages))
    }
  }

  const handleSingleChatSubmit =  async (e) => {
    e.preventDefault();
    const message = {
      sender: user._id,
      text: newMessage,
      conversationId: currentChat._id,
    };

    const receiverId = currentChat.members.find(
      (member) => member !== user._id
    );

    socket.current.emit("sendMessage", {
      senderName: user.username,
      senderId: user._id,
      receiverId,
      text: newMessage,
    });

    try {
      const res = await axios.post("/messages", message);
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      console.log(err);
    }
  }

  const handleRoomChatSubmit = async (e) => {
    e.preventDefault();

    console.log("Room data send submit")
    const message = {
      senderName: user.username,
      sender: user._id,
      text: newMessage,
      roomId: currentChat._id,
    };

    socket.current.emit('chatMessage', message);
    
    try {
      const res = await axios.post("/messages", message);
      console.log("Room data submit " + JSON.stringify(res.data))
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      console.log(err);
    }
    
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{width: "80%",margin: "auto",padding: "10px",height: "400px"}}>
    <div style={{display: "inline-block",float: "left",width: "400px",height: "auto"}}>
     <Tabs
      id="controlled-tab-example"
      activeKey={key}
      onSelect={(k) => setKey(k)}
      className="mb-3"
    >
      <Tab eventKey="friends" title="Friends">
      <div className="chatMenu">
          <div className="chatMenuWrapper">
            {friends.map((c,index) => (
              <div style={{
                backgroundColor: bg === ++index ? "rgb(245, 243, 243)" : "white"
              }} onClick={() => handleFriendConv(c,index)}>
                <div>
                  <div className="friendsContainer">
                  <span className="friendsName">{c.username}</span>&ensp;&ensp;
                  <span style={onlineUsers.includes(c._id) ? {color: "green"}: {color: "red"}}>{onlineUsers.includes(c._id) ? "Online" : "Offline"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Tab>
      <Tab eventKey="rooms" title="Chat Rooms">
      <div className="chatMenu">
          <div className="chatMenuWrapper">
            {roomsList.map((c,index) => (
              <div
              style={{
                backgroundColor: bgg === ++index ? "rgb(245, 243, 243)" : "white"
              }} onClick={() => handleGroup(c,index)}>
                <Group grpName = {c.roomName} />
              </div>
            ))}
          </div>
        </div>
      </Tab>
    </Tabs>
    </div>
    <div style={{display: "inline-block", height: "auto", width: "400px"}}>
    <div className="chatBox">
          <div className="chatBoxWrapper">
            {currentChat ? (
              <>
                <div className="chatBoxTop">
                  {messages.length>0 && messages.map((m) => (
                    <div ref={scrollRef}>
                      <Message message={m} own={m.sender === user._id} />
                    </div>
                  ))}
                </div>
                <div className="chatBoxBottom">
                  <textarea
                    className="chatMessageInput"
                    placeholder="write something..."
                    onChange={(e) => setNewMessage(e.target.value)}
                    value={newMessage}
                  ></textarea>
                  <button className="chatSubmitButton" onClick={tab === 1 ? handleSingleChatSubmit : handleRoomChatSubmit}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <span className="noConversationText">
                Start a chat.
              </span>
            )}
          </div>
        </div>
    </div>
    </div>
  );
}
