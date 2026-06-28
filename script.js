const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const preview = document.getElementById('preview');
const formatSelect = document.getElementById('format-select');
const modeSelect = document.getElementById('mode-select');
const qualitySlider = document.getElementById('quality');
const qualityLabel = document.getElementById('quality-label');
const qualityControl = document.getElementById('quality-control');
const targetSizeControl = document.getElementById('target-size-control');
const targetSizeInput = document.getElementById('target-size');
const convertBtn = document.getElementById('convert');
const downloads = document.getElementById('downloads');
const sizeSummary = document.getElementById('size-summary');
const faviconLink = document.getElementById('favicon-link');

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

qualitySlider.addEventListener('input', ()=> {
  qualityLabel.textContent = qualitySlider.value;
  updateSizePreview();
});

modeSelect.addEventListener('change', ()=> {
  updateModeUI();
  updateSizePreview();
});

targetSizeInput.addEventListener('input', ()=> updateSizePreview());
formatSelect.addEventListener('change', ()=> updateSizePreview());

convertBtn.addEventListener('click', ()=> {
  if(!currentImages.length) return;
  downloads.innerHTML = '';
  currentImages.forEach((image, index) => {
    convertImage(
      image,
      currentFiles[index].name,
      formatSelect.value,
      parseInt(qualitySlider.value,10),
      modeSelect.value,
      parseFloat(targetSizeInput.value) * 1024
    );
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
        // if first file, set favicon
        if(currentImages.length === 1){
          setFaviconFromImage(img);
        }
        if(currentImages.length === imageFiles.length){
          updateModeUI();
          updateSizePreview();
          // auto-convert when all files are loaded
          currentImages.forEach((image, index) => {
            convertImage(
              image,
              imageFiles[index].name,
              formatSelect.value,
              parseInt(qualitySlider.value,10),
              modeSelect.value,
              parseFloat(targetSizeInput.value) * 1024
            );
          });
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function setFaviconFromImage(img){
  const canvas = document.createElement('canvas');
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // Preserve pixel colors for small icons: disable image smoothing and draw with explicit source/dest sizes
  ctx.imageSmoothingEnabled = false;
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, sw, sh, 0, 0, size, size);
  canvas.toBlob((blob)=>{
    if(!blob) return;
    const url = URL.createObjectURL(blob);
    if(faviconLink){
      faviconLink.href = url;
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = url;
      document.head.appendChild(link);
    }
  }, 'image/png');
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

function updateModeUI(){
  const isTargetSize = modeSelect.value === 'target-size';
  qualityControl.classList.toggle('hidden', isTargetSize);
  targetSizeControl.classList.toggle('hidden', !isTargetSize);
}

function updateSizePreview(){
  if(!currentImages.length){
    sizeSummary.innerHTML = '<p class="size-placeholder">Choose images and adjust quality to preview output size.</p>';
    return;
  }

  sizeSummary.innerHTML = '';
  const qualityPercent = parseInt(qualitySlider.value, 10);
  const mimeType = formatSelect.value;
  const mode = modeSelect.value;
  const targetBytes = parseFloat(targetSizeInput.value || 200) * 1024;

  currentFiles.forEach((file, index) => {
    const image = currentImages[index];
    const row = document.createElement('div');
    row.className = 'size-row';
    row.innerHTML = `<span>${file.name}</span><strong>Estimating…</strong>`;
    sizeSummary.appendChild(row);

    if(!image){
      row.querySelector('strong').textContent = 'Missing image';
      return;
    }

    const updateRow = (blob) => {
      if(!blob) return;
      row.querySelector('strong').textContent = `Estimated: ${formatBytes(blob.size)}`;
    };

    renderOutputBlob(image, mimeType, qualityPercent, mode, targetBytes).then((result)=> {
      updateRow(result.blob);
    });
  });
}

function convertImage(img, originalName, mimeType, qualityPercent, mode, targetBytes){
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

  renderOutputBlob(img, mimeType, qualityPercent, mode, targetBytes).then((result)=> callback(result.blob));
}

function renderCanvasBlob(img, width, height, mimeType, qualityValue){
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, width, height);

    if(mimeType === 'image/png'){
      canvas.toBlob((blob)=> resolve(blob), 'image/png');
      return;
    }

    const quality = Math.max(0.01, Math.min(1, qualityValue));
    canvas.toBlob((blob)=> resolve(blob), 'image/jpeg', quality);
  });
}

async function renderOutputBlob(img, mimeType, qualityPercent, mode, targetBytes){
  if(mimeType === 'image/png'){
    return renderPngBlob(img, qualityPercent, mode, targetBytes);
  }

  return renderJpegBlob(img, qualityPercent, mode, targetBytes);
}

async function renderPngBlob(img, qualityPercent, mode, targetBytes){
  if(mode === 'target-size'){
    const candidates = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    let bestResult = null;

    for(const quality of candidates){
      const blob = await optimizePngBlob(img, quality);
      if(!blob) continue;
      if(blob.size <= targetBytes){
        return { blob, quality };
      }
      if(!bestResult || blob.size < bestResult.blob.size){
        bestResult = { blob, quality };
      }
    }

    return bestResult || { blob: null, quality: 1 };
  }

  const quality = Math.max(0.1, Math.min(1, qualityPercent / 100));
  const blob = await optimizePngBlob(img, quality);
  return { blob, quality };
}

function optimizePngBlob(img, qualityValue){
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const normalizedQuality = Math.max(0.1, Math.min(1, qualityValue));
    const levelCount = Math.max(2, Math.round(256 * normalizedQuality));
    const step = Math.max(1, 256 / levelCount);

    for(let i = 0; i < data.length; i += 4){
      for(let channel = 0; channel < 3; channel += 1){
        const value = data[i + channel];
        const quantized = Math.round(value / step) * step;
        data[i + channel] = Math.min(255, quantized);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => resolve(blob || null), 'image/png');
  });
}

async function renderJpegBlob(img, qualityPercent, mode, targetBytes){
  if(mode === 'target-size'){
    const candidates = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];
    let bestResult = null;

    for(const quality of candidates){
      const blob = await renderCanvasBlob(img, img.naturalWidth, img.naturalHeight, 'image/jpeg', quality);
      if(!blob) continue;
      if(blob.size <= targetBytes){
        return { blob, quality };
      }
      if(!bestResult || blob.size < bestResult.blob.size){
        bestResult = { blob, quality };
      }
    }

    return bestResult || { blob: null, quality: 1 };
  }

  const quality = Math.max(0.01, Math.min(1, qualityPercent / 100));
  const blob = await renderCanvasBlob(img, img.naturalWidth, img.naturalHeight, 'image/jpeg', quality);
  return { blob, quality };
}

function formatBytes(bytes){
  if(bytes < 1024) return bytes + ' B';
  const units = ['KB','MB','GB'];
  let i = -1;
  do { bytes = bytes/1024; i++; } while(bytes >= 1024 && i < units.length-1);
  return bytes.toFixed(2) + ' ' + units[i];
}