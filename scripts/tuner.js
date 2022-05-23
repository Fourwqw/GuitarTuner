console.log("auf");
window.onload = init();

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();

analyser.fftSize = 2048;
var bufferLength = analyser.fftSize;
var dataArray = new Uint8Array(bufferLength);
analyser.getByteTimeDomainData(dataArray);
var myCanvas;

document.querySelector(".start-button").addEventListener("click", function(){
    audioContext.resume();
})
//onclick="audioContext.resume();"
function Goertzel(buffer, sampleRate, freq)
{
    var w = 2 * 3.141592654 * freq / sampleRate;
    var cr = Math.cos(w);
    var ci = Math.sin(w);
    var coeff = 2 * cr;

    var sprev = 0;
    var sprev2 = 0;
    for(var n=0;n<buffer.length;n++)
    {
        var s = buffer[n] + coeff * sprev - sprev2;
        sprev2 = sprev;
        sprev = s;
    }
    var power = sprev2 * sprev2 + sprev * sprev - coeff * sprev * sprev2;
    
    return power;
}


function drawScope(buffer, sampleRate) 
{
    canvasCtx.lineWidth = 2; // 2
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = myCanvas.width * 1.0 / bufferLength;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) 
    {
        var v = buffer[i];// / 128.0;
        var y = v * myCanvas.height/2;
        y += myCanvas.height/2;
        //y += myCanvas.height/2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(myCanvas.width, myCanvas.height/2);
    canvasCtx.stroke();
}

function drawGuitar(buffer, sampleRate) 
{
    canvasCtx.beginPath();
    for(var s=0;s<6;s++)
    {
        var x = (myCanvas.width / 7 )*(s+1);
        canvasCtx.moveTo(x, 300);
        canvasCtx.lineTo(x, 0);
    }
    canvasCtx.stroke();

    var freqs = [ 329, 246,196,146,110,82];
    canvasCtx.beginPath();
    
    for(var s=0;s<6;s++)
    {
        var x = (myCanvas.width/7)*(s+1);
        for(var f=-10;f<10;f++)
        {
            var power = Math.sqrt(Goertzel(buffer, sampleRate, freqs[s] + f*2));
            
            canvasCtx.moveTo(x+f*3, 300);
            canvasCtx.lineTo(x+f*3, 300-power);
        }
    }
    canvasCtx.stroke();
};

var noteName = [  'C', 'C#', 'D','D#', 'E', 'F', 'F#', 'G', 'G#',  'A','A#', 'B'];
function NoteNameFromNote(note)
{
    note += 8;
    var octave = Math.floor(note / noteName.length)
    return noteName[note % noteName.length] + octave;
}

function FreqFromNote(note)
{
    return 440.0*Math.pow(2, (note-49)/12);
}

function DrawPiano(buffer, sampleRate) 
{
    var noteFreqs = [ 329, 246, 196, 146, 110, 82];
    var noteNumber = [ 20, 25, 30, 35, 39, 44 ];
    
    canvasCtx.font="14px ti92pluspc";
    canvasCtx.textAlign="center"; 
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = 'rgb(255, 0, 0)';
    
    for(var i=0; i < noteNumber.length; i++)
    {
        note = noteNumber[i]
        var x = ( myCanvas.width / 66 ) * (note+1); // 88 66
        canvasCtx.moveTo(x, 270);
        canvasCtx.lineTo(x, 0);
        canvasCtx.fillText(NoteNameFromNote(note),x,290);
    }       
    canvasCtx.stroke();    
    
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    for(var note=0; note < 88; note++)
    {
        var x = (myCanvas.width / 66)*(note+1); // 88
        
        var power = Math.sqrt(Goertzel(buffer, sampleRate, FreqFromNote(note)));
        
        canvasCtx.moveTo(x, 270);
        canvasCtx.lineTo(x, 270-power);
    }
    
    canvasCtx.moveTo(0, 271);
    canvasCtx.lineTo(600, 271);
    
    canvasCtx.stroke();
}

function draw(buffer, sampleRate) 
{
    canvasCtx.clearRect(0, 0, 600, 300);
    canvasCtx.fillStyle = 'rgb(100, 100, 100)';
    canvasCtx.fillRect(0, 0, canvasCtx.width, canvasCtx.height);

    DrawPiano(buffer, sampleRate) ;
};

var audioContext;

function init()
{
    myCanvas = document.getElementById("myCanvas");
    canvasCtx = myCanvas.getContext('2d');    
    myCanvas.height = myCanvas.clientHeight
    myCanvas.width = myCanvas.clientWidth
    console.log(myCanvas.clientHeight + " " + myCanvas.clientWidth)
    var bufferSize = 4096;
  
    try 
    {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
    } 
    catch(e) 
    {
        alert('Web Audio API is not supported in this browser');
    }

    // проверка подключен ли микрофон

    try 
    {
        navigator.getUserMedia = navigator.getUserMedia ||
                                 navigator.webkitGetUserMedia ||
                                 navigator.mozGetUserMedia ||
                                 navigator.msGetUserMedia;
        var hasMicrophoneInput = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    } 
    catch(e) 
    {
        alert("getUserMedia() is not supported in your browser");
    }

    // Создание PCM процесса для фильтра 
    var bufferSize = 4096;
    var myPCMProcessingNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
    myPCMProcessingNode.onaudioprocess = function(e) 
    {
        var input = e.inputBuffer.getChannelData(0);
        var output = e.outputBuffer.getChannelData(0);
        draw(input,  e.inputBuffer.sampleRate);
    }

    canvasCtx.fillStyle = "black";
    canvasCtx.textAlign="center"; 
    canvasCtx.textBaseline="middle";
    canvasCtx.font="40px arial";
    canvasCtx.fillText("Click to start", myCanvas.width/2, myCanvas.height/2);
    

    var errorCallback = function(e) 
    {
        alert("Error in getUserMedia: " + e);
    };  
    // Запрос разрешения на микрофон с помощью кнопки
    document.querySelector(".mic-button").addEventListener("click", function(){
        navigator.getUserMedia({audio: true}, function(stream) 
        {
            var microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(myPCMProcessingNode);
            myPCMProcessingNode.connect(audioContext.destination);
        }, errorCallback);
    })

}

