const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const preview = document.getElementById('preview');
const formatSelect = document.getElementById('format-select');
const qualitySlider = document.getElementById('quality');
const qualityLabel = document.getElementById('quality-label');
const convertBtn = document.getElementById('convert');
const downloads = document.getElementById('downloads');

let currentFiles = [];
let currentImages = [];

['dragenter','dragover','dragleave','drop'].forEach(evt => {
  dropArea.addEventListener(evt, (e)=> e.preventDefault());
});

dropArea.addEventListener('dragover', ()=> dropArea.classList.add('dragover'));
dropArea.addEventListener('dragleave', ()=> dropArea.classList.remove('dragover'));
dropArea.addEventListener('drop', (e)=>{
  dropArea.classList.remove('dragover');
  const items = e.dataTransfer.files;
  if(items && items.length) handleFiles(Array.from(items));
});

fileElem.addEventListener('change', (e)=>{
  if(e.target.files && e.target.files.length) handleFiles(Array.from(e.target.files));
});

qualitySlider.addEventListener('input', ()=> qualityLabel.textContent = qualitySlider.value);

convertBtn.addEventListener('click', ()=> {
  if(!currentImages.length) return;
  downloads.innerHTML = '';
  currentImages.forEach((image, index) => {
    convertImage(image, currentFiles[index].name, formatSelect.value, parseInt(qualitySlider.value,10));
  });
});

function handleFiles(files){
  const imageFiles = files.filter(file => file.type.startsWith('image/'));
  if(!imageFiles.length){
    alert('Please provide image files (PNG or JPG).');
    return;
  }

  currentFiles = imageFiles;
  currentImages = [];
  preview.innerHTML = '';
  downloads.innerHTML = '';

  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = ()=>{
      const img = new Image();
      img.onload = ()=>{
        currentImages.push(img);
        addPreview(img, file.name);
        if(currentImages.length === imageFiles.length){
          // auto-convert when all files are loaded
          currentImages.forEach((image, index) => {
            convertImage(image, imageFiles[index].name, formatSelect.value, parseInt(qualitySlider.value,10));
          });
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function addPreview(img, filename){
  const item = document.createElement('div');
  item.className = 'preview-item';
  const thumb = document.createElement('img');
  const label = document.createElement('span');
  thumb.src = img.src;
  label.textContent = filename;
  item.appendChild(thumb);
  item.appendChild(label);
  preview.appendChild(item);
}

function convertImage(img, originalName, mimeType, qualityPercent){
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const quality = Math.max(0.01, Math.min(1, qualityPercent / 100));
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const filename = originalName.replace(/\.[^.]+$/, '') + '.' + extension;

  const callback = (blob) => {
    if(!blob) return alert('Conversion failed');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.className = 'btn download-item';
    link.textContent = `Download ${filename} (${formatBytes(blob.size)})`;
    downloads.appendChild(link);
  };

  if(mimeType === 'image/png'){
    canvas.toBlob((blob)=> callback(blob), 'image/png');
  } else {
    canvas.toBlob((blob)=> callback(blob), 'image/jpeg', quality);
  }
}

function formatBytes(bytes){
  if(bytes < 1024) return bytes + ' B';
  const units = ['KB','MB','GB'];
  let i = -1;
  do { bytes = bytes/1024; i++; } while(bytes >= 1024 && i < units.length-1);
  return bytes.toFixed(2) + ' ' + units[i];
}