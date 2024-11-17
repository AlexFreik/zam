const INPUTS_SIZE = 100;

function prerenderVmixWeb() {
    let inputsHTML = '';
    let mixersHTML = '';
    for (let i = 1; i <= INPUTS_SIZE; i++) {
        inputsHTML += `
          <div id="input-${i}" class="inline-block mx-1 my-1 border border-neutral hidden">
            <button class="preview-btn btn w-64 whitespace-nowrap overflow-hidden flex h-fit min-h-0 justify-start p-0 gap-0 rounded-none" onclick="previewInput(${i})">
              <span class="badge badge-neutral mx-1 my-1 w-[24px]">${i}</span>
              <span class="input-title whitespace-nowrap overflow-hidden inline-flex flex-1"></span>
            </button>
            <div class="m-1">
            <button class="overlay1-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded" onclick="overlayInput(${i}, 1)"}>1</button>
            <button class="overlay2-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded" onclick="overlayInput(${i}, 2)"}>2</button>
            <button class="overlay3-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded" onclick="overlayInput(${i}, 3)"}>3</button>
            <button class="overlay4-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded" onclick="overlayInput(${i}, 4)"}>4</button>
            <button class="audio-btn btn btn-neutral w-fit h-[20px] min-h-0 px-2 rounded" onclick="muteInput(${i})">AUDIO</button>
            <button class="loop-btn btn btn-neutral w-fit h-[20px] min-h-0 px-2 rounded" onclick="loopInput(${i})"}>LOOP</button>
            </div>
          </div>`;

        mixersHTML += `
          <div id="mixer-${i}" class="inline-block w-[95px] border border-neutral pb-1 m-1 bg-base-100 hidden">
            <div class="whitespace-nowrap overflow-hidden bg-primary-content mb-1">
              <span class="badge badge-neutral w-[24px] mx-1 my-1">${i}</span></div>
            <div class="relative ">
              <div class="inline-block h-24 w-1">
                <div class="bg-black" style="height: 100%"></div>
                <div class="bg-success" style="height: 0%"></div>
              </div>
              <div class="inline-block h-24 w-1">
                <div class="bg-black" style="height: 100%"></div>
                <div class="bg-success" style="height: 0%"></div>
              </div>
              <div class="inline-block -mt-5 text-center">
                100%
                <br />
                <button class="btn btn-xs btn-outline" onclick="fadeAudio(${i}, 0)"}>0%</button>
                <br />
                <button class="btn btn-xs btn-outline" onclick="fadeAudio(${i}, 91)"}>69%</button>
                <br />
                <button class="btn btn-xs btn-outline" onclick="fadeAudio(${i}, 100)"}>100%</button>
              </div>
            </div>
            <div class="px-1">
              <span class="badge badge-sm rounded w-[22px] badge-neutral">M</span>
              <span class="badge badge-sm rounded w-[22px] badge-neutral">A</span>
              <span class="badge badge-sm rounded w-[22px] badge-neutral">B</span>
            </div>
          </div>`;
    }

    document.getElementById('vmix-inputs').innerHTML = inputsHTML;
    document.getElementById('vmix-mixers').innerHTML = mixersHTML;
}

async function renderVmixWeb() {
    const vmixContainer = document.getElementById('vmix-container');
    const masterInput = document.getElementById('master');
    const disabled = document.getElementById('view-mode').checked;

    const master = getMaster();
    if (master === null) {
        hideVmixWeb();
        masterInput.classList.add('input-error');
        return;
    }
    masterInput.classList.remove('input-error');

    const vmixInfo = getVmixInfo(master);
    if (vmixInfo === null || vmixInfo.error) {
        hideVmixWeb();
        return;
    }
    showVmixWeb();
    const info = vmixInfo.value;

    const active = info.inputs[info.active];
    const preview = info.inputs[info.preview];
    const screensElem = document.getElementById('vmix-screens');
    document.getElementById('active-title').innerHTML = active.title;
    document.getElementById('preview-title').innerHTML = preview.title;
    const ftbBtn = screensElem.querySelector('.ftb-btn');
    if (info.fadeToBlack) {
        ftbBtn.classList.remove('btn-neutral');
        ftbBtn.classList.add('btn-error');
    } else {
        ftbBtn.classList.add('btn-neutral');
        ftbBtn.classList.remove('btn-error');
    }

    const inputLength = info.inputs.length;
    for (let i = inputLength; i <= INPUTS_SIZE; i++) {
        document.getElementById('input-' + i).classList.add('hidden');
    }
    info.inputs.forEach((input, i) => {
        const inputElem = document.getElementById('input-' + i);
        inputElem.classList.remove('hidden');
        inputElem.querySelector('.input-title').innerHTML = getResponsiveTitle(input.title);
        const previewBtn = inputElem.querySelector('.preview-btn');
        setColor(previewBtn, i === info.active, i === info.preview);

        const overlay1Btn = inputElem.querySelector('.overlay1-btn');
        setColor(overlay1Btn, info.overlays[1] === i);
        const overlay2Btn = inputElem.querySelector('.overlay2-btn');
        setColor(overlay2Btn, info.overlays[2] === i);
        const overlay3Btn = inputElem.querySelector('.overlay3-btn');
        setColor(overlay3Btn, info.overlays[3] === i);
        const overlay4Btn = inputElem.querySelector('.overlay4-btn');
        setColor(overlay4Btn, info.overlays[4] === i);

        const audioBtn = inputElem.querySelector('.audio-btn');
        setColor(audioBtn, input.muted === 'False');
        const loopBtn = inputElem.querySelector('.loop-btn');
        setColor(loopBtn, input.loop === 'True');

        //      const isActive = i === info.active;
        //      const isPreview = i === info.preview;
        //      const style = isActive ? 'bg-green-700' : isPreview ? 'bg-yellow-600' : 'bg-neutral';
        //      inputsHTML += `
        //          <div class="inline-block mx-1 my-1 border border-neutral">
        //              <div class="${style} w-64 whitespace-nowrap overflow-hidden flex ${disabled ? '"' : `cursor-pointer" disabled onclick="previewInput(${i})"`}">
        //                  <span class="badge badge-neutral mx-1 my-1 w-[24px]">${input.number}</span>
        //                  ${getResponsiveTitle(input.title)}</span>
        //              </div>
        //              <div class="m-1">
        //              <span class="badge rounded ${info.overlays[1] === i ? 'bg-green-700' : 'badge-neutral'} w-[22px] ${disabled ? '"' : `cursor-pointer" : onclick="overlayInput(${i}, 1)"`}>1</span>
        //              <span class="badge rounded ${info.overlays[2] === i ? 'bg-green-700' : 'badge-neutral'} w-[22px] ${disabled ? '"' : `cursor-pointer" onclick="overlayInput(${i}, 2)"`}>2</span>
        //              <span class="badge rounded ${info.overlays[3] === i ? 'bg-green-700' : 'badge-neutral'} w-[22px] ${disabled ? '"' : `cursor-pointer" onclick="overlayInput(${i}, 3)"`}>3</span>
        //              <span class="badge rounded ${info.overlays[4] === i ? 'bg-green-700' : 'badge-neutral'} w-[22px] ${disabled ? '"' : `cursor-pointer" onclick="overlayInput(${i}, 4)"`}>4</span>
        //              <span class="badge rounded ${input.muted === 'False' ? 'bg-green-700' : 'badge-neutral'} ${disabled ? '"' : `cursor-pointer" onclick="muteInput(${i}, ${input.muted === 'False'})"`}>AUDIO</span>
        //              <span class="badge rounded ${input.loop === 'True' ? 'bg-green-700' : 'badge-neutral'} ${disabled ? '"' : `cursor-pointer" onclick="loopInput(${i}, ${input.loop === 'True'})"`}>LOOP</span>
        //              </div>
        //          </div>`;
        //      if (input.volume !== undefined) {
        //          const meterF1 = Math.round(parseFloat(input.meterF1) * 100);
        //          const meterF2 = Math.round(parseFloat(input.meterF2) * 100);
        //          mixersHTML += `
        //            <div class="inline-block w-[95px] border border-neutral pb-1 m-1 bg-base-100">
        //              <div class="whitespace-nowrap overflow-hidden ${input.muted === 'False' ? 'bg-green-700' : 'bg-primary-content'} mb-1">
        //                <span class="badge badge-neutral w-[24px] mx-1 my-1">${input.number}</span>${input.title}
        //                  </div>
        //              <div class="relative ">
        //                <div class="inline-block h-24 w-1">
        //                    <div class="bg-black" style="height: ${100 - meterF1}%"></div>
        //                    <div class="bg-green-500" style="height: ${meterF1}%"></div>
        //                </div>
        //                <div class="inline-block h-24 w-1">
        //                    <div class="bg-black" style="height: ${100 - meterF2}%"></div>
        //                    <div class="bg-green-500" style="height: ${meterF2}%"></div>
        //                </div>
        //                <div class="inline-block -mt-5 text-center">
        //                  ${Math.round(input.volume)}%
        //                  <br />
        //                  <button class="btn btn-xs btn-outline" onclick="fadeAudio(${i}, 0)" ${disabled ? 'disabled' : ''}>0%</button>
        //                  <br />
        //                  <button class="btn btn-xs btn-outline" onclick="fadeAudio(${i}, 91)" ${disabled ? 'disabled' : ''}>70%</button>
        //                  <br />
        //                  <button class="btn btn-xs btn-outline" onclick="fadeAudio(${i}, 100)" ${disabled ? 'disabled' : ''}>100%</button>
        //                </div>
        //              </div>
        //              <div class="px-1">
        //                  <span class="badge badge-sm rounded w-[22px] ${input.audiobusses.includes('M') ? 'bg-green-700' : 'badge-neutral'}">M</span>
        //                  <span class="badge badge-sm rounded w-[22px] ${input.audiobusses.includes('A') ? 'bg-green-700' : 'badge-neutral'}">A</span>
        //                  <span class="badge badge-sm rounded w-[22px] ${input.audiobusses.includes('B') ? 'bg-green-700' : 'badge-neutral'}">B</span>
        //              </div>
        //            </div>`;
        //      }
    });
}

function setColor(elem, active, preview = false) {
    if (active) {
        elem.classList.remove('btn-neutral');
        elem.classList.add('btn-success');
        elem.classList.remove('btn-warning');
    } else if (preview) {
        elem.classList.remove('btn-neutral');
        elem.classList.remove('btn-success');
        elem.classList.add('btn-warning');
    } else {
        elem.classList.add('btn-neutral');
        elem.classList.remove('btn-success');
        elem.classList.remove('btn-warning');
    }
}

function hideVmixWeb() {
    const vmixContainer = document.getElementById('vmix-container');
    if (!vmixContainer.classList.contains('hidden')) {
        vmixContainer.classList.add('hidden');
    }
}

function showVmixWeb() {
    const vmixContainer = document.getElementById('vmix-container');
    if (vmixContainer.classList.contains('hidden')) {
        vmixContainer.classList.remove('hidden');
    }
}

function getMaster() {
    const master = parseInt(document.getElementById('master').value);
    return isNaN(master) ? null : master;
}

function getMasterInfo() {
    const master = getMaster();
    const info = getVmixInfo(master)?.value;
    if (info === undefined || info === null) {
        showError('Internal Error', "Couldn't fetch vMix status for box " + master);
        return null;
    }
    return info;
}

function getSlaves() {
    const slaves = document.getElementById('slaves').value;
    return parseNumbers(slaves);
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Pad hours, minutes, and seconds with leading zero if needed
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getInputProgress(input) {
    if (input.duration === '0') return '';
    console.assert(['Video', 'AudioFile', 'Photos'].includes(input.type));
    const duration = parseInt(input.duration);
    const position = parseInt(input.position);
    const remaining = duration - position;

    if (input.type === 'Photos') {
        return `${position} / ${duration} / ${remaining}`;
    }
    return `${formatTime(position)} / ${formatTime(duration)} / ${formatTime(remaining)}`;
}

function previewInput(inputNum) {
    masterSlaveExecute('Function=PreviewInput&Input=' + inputNum);
}

function transition(type) {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const inputNum = info.preview;
    const inputParam = type === 'FadeToBlack' ? '' : '&Input=' + inputNum;
    masterSlaveExecute('Function=' + type + inputParam);
}

function fadeAudio(inputNum, vol) {
    masterSlaveExecute('Function=SetVolumeFade&Value=' + vol + ',3000&Input=' + inputNum);
}

function overlayInput(inputNum, overlayNum) {
    masterSlaveExecute('Function=OverlayInput' + overlayNum + '&Input=' + inputNum);
}

function muteInput(inputNum) {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const on = info.inputs[inputNum].muted === 'False';
    masterSlaveExecute(`Function=${on ? 'AudioOff' : 'AudioOn'}&Input=${inputNum}`);
}

function loopInput(inputNum) {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const on = info.inputs[inputNum].loop === 'True';
    masterSlaveExecute(`Function=${on ? 'LoopOff' : 'LoopOn'}&Input=${inputNum}`);
}

function masterSlaveExecute(command) {
    const master = getMaster();
    const slaves = getSlaves();
    slaves.unshift(master);
    slaves
        .map((num) => getBoxHost(getBox(num)))
        .forEach((host) => execute(getApiUrl(host, command)));
}
