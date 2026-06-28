const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const preview = document.getElementById('preview');
const formatSelect = document.getElementById('format-select');
const qualitySlider = document.getElementById('quality');
const qualityLabel = document.getElementById('quality-label');
const convertBtn = document.getElementById('convert');
const downloadLink = document.getElementById('download-link');

let currentFile = null;
let currentImage = null;

['dragenter','dragover','dragleave','drop'].forEach(evt => {
  dropArea.addEventListener(evt, (e)=> e.preventDefault());
});

dropArea.addEventListener('dragover', ()=> dropArea.classList.add('dragover'));
dropArea.addEventListener('dragleave', ()=> dropArea.classList.remove('dragover'));
dropArea.addEventListener('drop', (e)=>{
  dropArea.classList.remove('dragover');
  const items = e.dataTransfer.files;
  if(items && items.length) handleFile(items[0]);
});

fileElem.addEventListener('change', (e)=>{
  if(e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
});

qualitySlider.addEventListener('input', ()=> qualityLabel.textContent = qualitySlider.value);

convertBtn.addEventListener('click', ()=> {
  if(!currentFile || !currentImage) return;
  convertImage(currentImage, formatSelect.value, parseInt(qualitySlider.value,10));
});

function handleFile(file){
  if(!file.type.startsWith('image/')){
    alert('Please provide an image file (PNG or JPG).');
    return;
  }
  currentFile = file;
  const reader = new FileReader();
  reader.onload = ()=>{
    const img = new Image();
    img.onload = ()=>{
      currentImage = img;
      showPreview(img);
      // auto-convert using current settings
      convertImage(img, formatSelect.value, parseInt(qualitySlider.value,10));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function showPreview(img){
  preview.innerHTML = '';
  const thumb = document.createElement('img');
  thumb.src = img.src;
  preview.appendChild(thumb);
}

function convertImage(img, mimeType, qualityPercent){
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const quality = Math.max(0.01, Math.min(1, qualityPercent / 100));

  // Use toBlob for better memory handling
  if(mimeType === 'image/png'){
    canvas.toBlob((blob)=> handleBlob(blob, 'converted.png'), 'image/png');
  } else if(mimeType === 'image/jpeg'){
    canvas.toBlob((blob)=> handleBlob(blob, 'converted.jpg'), 'image/jpeg', quality);
  } else {
    // fallback to jpeg
    canvas.toBlob((blob)=> handleBlob(blob, 'converted.jpg'), 'image/jpeg', quality);
  }
}

function handleBlob(blob, filename){
  if(!blob) return alert('Conversion failed');
  const url = URL.createObjectURL(blob);
  downloadLink.href = url;
  downloadLink.download = filename;
  downloadLink.classList.remove('disabled');
  downloadLink.textContent = `Download (${formatBytes(blob.size)})`;
}

function formatBytes(bytes){
  if(bytes < 1024) return bytes + ' B';
  const units = ['KB','MB','GB'];
  let i = -1;
  do { bytes = bytes/1024; i++; } while(bytes >= 1024 && i < units.length-1);
  return bytes.toFixed(2) + ' ' + units[i];
}