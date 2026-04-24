import whisper

model = whisper.load_model("base")

result = model.transcribe("test_audio.wav")

print(result["text"])