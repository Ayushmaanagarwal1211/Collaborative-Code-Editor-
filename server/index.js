const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
const cors = require("cors");
const axios = require("axios");
const server = http.createServer(app);
require("dotenv").config();

const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  nodejs: { versionIndex: "3" },
  c: { versionIndex: "4" },
  ruby: { versionIndex: "3" },
  go: { versionIndex: "3" },
  scala: { versionIndex: "3" },
  bash: { versionIndex: "3" },
  sql: { versionIndex: "3" },
  pascal: { versionIndex: "2" },
  csharp: { versionIndex: "3" },
  php: { versionIndex: "3" },
  swift: { versionIndex: "3" },
  rust: { versionIndex: "3" },
  r: { versionIndex: "3" },
};

// Enable CORS
app.use(cors({
  origin: "*", // Change this to a specific origin if needed
  methods: ["GET", "POST"],
}));
// Parse JSON bodies
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  // console.log('Socket connected', socket.id);
  socket.on("join", ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    console.log(userSocketMap)
    const clients = getAllConnectedClients(roomId);
    // notify that new user join
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // sync the code
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  // when new user join the room all the code which are there are also shows on that persons editor
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // leave room
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    // leave all the room
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});
const postSubmission = async (language_id, source_code, stdin) => {
  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions',
    params: { base64_encoded: 'true', fields: '*' },
    headers: {
      'content-type': 'application/json',
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': 'b4e5c5a05fmsh9adf6ec091523f8p165338jsncc58f31c26e1',
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    data: JSON.stringify({
      language_id: language_id,
      source_code: source_code,
      stdin: stdin
    })
  };

  const res = await axios.request(options);
  console.log(res.data,"TOKENENNNNNNNNNNNNNN")
  return res.data.token
}
const languageMap = {
  'python3': 70,       // Python 3
  'java': 62,         // Java
  'nodejs': 63,  // Node.js         // Go
  // Add more languages as needed
};
const getOutput = async (token) => {
  // we will make api call here
  const options = {
    method: 'GET',
    url: "https://judge0-ce.p.rapidapi.com/submissions/" + token,
    params: { base64_encoded: 'true', fields: '*' },
    headers: {
      'X-RapidAPI-Key': '3ed7a75b44mshc9e28568fe0317bp17b5b2jsn6d89943165d8',
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    }
  };

  // call the api
  const res = await axios.request(options);
  if (res.data.status_id <= 2) {
    const res2 = await getOutput(token);
    return res2.data;
  }
  return res.data;
}
const encode = (str) => {
  return Buffer.from(str, "binary").toString("base64")
}

const decode = (str) => {
  return Buffer.from(str, 'base64').toString()
}
app.post("/compile", async (req, res1) => {
    const { code, language } = req.body;
    const language_id = languageMap[language.toLowerCase()];
    const source_code = encode(code);
    const stdin = '';
    const token = await postSubmission(language_id,source_code,stdin);
    if(token){
      console.log(token)
      const res = await getOutput(token);
      if(res && res.stdout){
        const decoded_output = decode(res.stdout ? res.stdout : '');
        return res1.json(decoded_output);
      }
    }
    return res1.json({error:"SDSDSDDDDDDDDDDDDDD"});

    // const status_name = res.status.description;
    // const decoded_compile_output = decode(res.compile_output ? res.compile_output : '');
    // const decoded_error = decode(res.stderr ? res.stderr : '');
    
    // console.log(decoded_output)
    // call the api

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is runnint on port ${PORT}`));
