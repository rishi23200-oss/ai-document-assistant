const API = "https://ai-document-assistant-52qg.onrender.com"

const chatBox=document.getElementById("chatBox")

function addUser(msg){

chatBox.innerHTML+=`<div class="user-msg">You: ${msg}</div>`

chatBox.scrollTop=chatBox.scrollHeight
}

function addAI(msg){

chatBox.innerHTML+=`<div class="ai-msg">AI: ${msg}</div>`

chatBox.scrollTop=chatBox.scrollHeight
}

function showTyping(){

chatBox.innerHTML+=`<div class="ai-msg typing" id="typing">AI typing...</div>`
}

function removeTyping(){

const t=document.getElementById("typing")

if(t) t.remove()
}

async function uploadPDF(){

const file=document.getElementById("pdfFile").files[0]

if(!file){
alert("Select PDF")
return
}

const formData=new FormData()
formData.append("file",file)

await fetch(`${API}/upload-pdf`,{
method:"POST",
body:formData
})

addAI("📄 PDF uploaded successfully")
}

async function askQuestion(){

const question=document.getElementById("question").value

addUser(question)

showTyping()

const formData=new FormData()

formData.append("question",question)

const res=await fetch(`${API}/ask`,{
method:"POST",
body:formData
})

const data=await res.json()

removeTyping()

addAI(data.answer)

document.getElementById("question").value=""
}

async function summarize(){

const text=document.getElementById("text").value

showTyping()

const res=await fetch(`${API}/summarize`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({text})
})

const data=await res.json()

removeTyping()

document.getElementById("summary").innerHTML=
`<div class="ai-msg">${data.summary}</div>`
}


async function uploadAudio(){

const audio=document.getElementById("audioFile").files[0]

if(!audio){
alert("Select audio file")
return
}

const formData=new FormData()
formData.append("file",audio)

showTyping()

try{

const res=await fetch("http://127.0.0.1:8000/upload-audio",{
method:"POST",
body:formData
})

const data=await res.json()

removeTyping()

addAI("🎤 Audio uploaded successfully<br>Text: "+data.text)

}catch(err){

removeTyping()

addAI("❌ Audio upload failed")

console.log(err)

}

}

async function uploadVideo(){

const video=document.getElementById("videoFile").files[0]

if(!video){
alert("Select video")
return
}

const formData=new FormData()
formData.append("file",video)

showTyping()

const res=await fetch(`${API}/upload-video`,{
method:"POST",
body:formData
})

const data=await res.json()

removeTyping()

addAI("🎥 Video processed successfully: " + (data.text || "No speech detected"))

}
function toggleTheme(){

if(document.body.style.background=="white"){

document.body.style.background="#0f172a"
document.body.style.color="white"

}else{

document.body.style.background="white"
document.body.style.color="black"

}
}

let recorder
let audioChunks=[]

async function startRecording(){

const stream=await navigator.mediaDevices.getUserMedia({audio:true})

recorder=new MediaRecorder(stream)

recorder.start()

audioChunks=[]

recorder.ondataavailable=e=>{
audioChunks.push(e.data)
}

recorder.onstop=sendRecording

setTimeout(()=>{
recorder.stop()
},5000)
}

async function sendRecording(){

const blob=new Blob(audioChunks,{type:"audio/wav"})

const formData=new FormData()

formData.append("file",blob,"record.wav")

showTyping()

const res=await fetch(`${API}/upload-audio`,{
method:"POST",
body:formData
})

const data=await res.json()

removeTyping()

addAI("🎤 "+data.text)
}