// Color Group Selections
const colorDivs = document.querySelectorAll('.color');
const currentHexColors = document.querySelectorAll('.color h2');
const adjustBtns = document.querySelectorAll('.adjust');
const closeAdjustBtns = document.querySelectorAll('.close-adjustment');
const lockBtns = document.querySelectorAll('.lock');
const sliderContainers = document.querySelectorAll('.sliders');
const sliders = document.querySelectorAll('input[type="range"]');

// Panel selections
const libraryBtn = document.querySelector('.library');
const libPanel = document.querySelector('.library-container');
const closeLibBtn = document.querySelector('.close-library');

const generateBtn = document.querySelector('.generate');

// save panel elements
const saveBtn = document.querySelector('.save');
const closeSavebtn = document.querySelector('.close-save');
const saveSubmitBtn = document.querySelector('.submit-save');
const saveInput = document.querySelector('.save-name');
const savePanel = document.querySelector('.save-container');

// Popup selections
const copyPanel = document.querySelector('.copy-container');

// Variables
let colorsArr = [];
let savedPalettes = [];

// Event Listeners
colorDivs.forEach((div, index) => {
  div.addEventListener('change', () => {
    updateColorText(index);
  });
});

currentHexColors.forEach(text => {
  text.addEventListener('click', e => {
    // console.log(e.target.innerText); // Testing that we get the hex value on click
    copyToClipbord(text);
  });
});

adjustBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    toggleSlider(index);
  });
});
closeAdjustBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    toggleSlider(index);
  });
});
lockBtns.forEach((btn, index) => {
  btn.addEventListener('click', e => {
    lockColor(e, index);
  });
});

sliders.forEach(slider => {
  slider.addEventListener('input', e => {
    hslControls(e);
  });
});

copyPanel.addEventListener('transitionend', () => {
  const popupBox = copyPanel.children[0];
  popupBox.classList.remove('active');
  copyPanel.classList.remove('active');
});

libraryBtn.addEventListener('click', () => {
  console.log('Open Library of saved palettes');
  toggleLibPanel();
});

closeLibBtn.addEventListener('click', () => {
  toggleLibPanel();
});

generateBtn.addEventListener('click', () => {
  createColors();
});

saveBtn.addEventListener('click', () => {
  toggleSavePanel();
});

closeSavebtn.addEventListener('click', () => {
  toggleSavePanel();
});

saveSubmitBtn.addEventListener('click', e => {
  e.preventDefault();
  savePalette();
});

// Functions

//* Initialize random colors, and propagate the library with saved palettes from localStorage
function startApp() {
  createColors();
  if (localStorage.key('palettes')) {
    savedPalettes = JSON.parse(localStorage.getItem('palettes'));
  }
  savedPalettes.forEach(palette => {
    addToLibrary(palette);
  });
}
//* logic for adding a palette object to the library
function addToLibrary(palette) {
  // console.log(`${palette.name} added to library`);
  const paletteDiv = document.createElement('div');
  paletteDiv.classList.add('custom-palette');

  const title = document.createElement('h4');
  title.innerText = palette.name;

  const previewDiv = document.createElement('div');
  previewDiv.classList.add('preview');
  palette.colors.forEach(color => {
    const colorPreview = document.createElement('div');
    colorPreview.classList.add('color');
    colorPreview.style.background = color;
    previewDiv.appendChild(colorPreview);
  });

  const paletteBtn = document.createElement('button');
  paletteBtn.classList.add('palette-select');
  paletteBtn.classList.add(palette.num);
  paletteBtn.innerText = 'Select';

  paletteBtn.addEventListener('click', () => {
    updateColors(palette.colors);
    toggleLibPanel();
  });

  paletteDiv.appendChild(title);
  paletteDiv.appendChild(previewDiv);
  paletteDiv.appendChild(paletteBtn);
  libPanel.children[0].appendChild(paletteDiv);
}

//* generate a random color in rgb and return it
function generateRGB() {
  const color = chroma.random();
  return color;
}

//* generate new random colors
function createColors() {
  colorsArr = [];
  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    const color = generateRGB();

    // Check if color group ia locked, and write the old hex to the array
    if (div.classList.contains('locked')) {
      colorsArr.push(hexText.innerText);
      return;
    } else {
      // Push the random generated color to the initialColors array to retain it, before returning it.
      colorsArr.push(color.hex());
    }

    console.log(hexText.innerText);

    // Apply hex values to div background and text
    hexText.innerText = color;
    div.style.background = color;
    // Set text color in the color field depending on contrast
    checkContrast(color, hexText);
    // And also change the colors of the control icons based on the contrast
    const controlBtns = div.querySelectorAll('.controls button');
    controlBtns.forEach(icon => {
      checkContrast(color, icon);
    });

    // initialize sliders
    const currentColor = chroma(color);
    const currentSliders = div.querySelectorAll('.sliders input');
    // console.log(currentSliders)
    const hue = currentSliders[0];
    const brightness = currentSliders[1];
    const saturation = currentSliders[2];

    updateSliders(currentColor, hue, brightness, saturation);
  });
  initSliderPositions();
}

//* update the colors in the divs
function updateColors(colors) {
  console.log(colors);
  colorsArr = [];
  colors.forEach(color => {
    colorsArr.push(color);
  });
  console.log(colorsArr);
  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    hexText.innerText = colors[index];
    div.style.background = colors[index];

    // Set text color in the color field depending on contrast
    checkContrast(colors[index], hexText);
    // And also change the colors of the control icons based on the contrast
    const controlBtns = div.querySelectorAll('.controls button');
    controlBtns.forEach(icon => {
      checkContrast(colors[index], icon);
    });
    const currentColor = chroma(colors[index]);
    const currentSliders = div.querySelectorAll('.sliders input');
    // console.log(currentSliders)
    const hue = currentSliders[0];
    const brightness = currentSliders[1];
    const saturation = currentSliders[2];

    updateSliders(currentColor, hue, brightness, saturation);
  });
  initSliderPositions();
}

//* Check contrast, if the luminance of the color is high, and change text color of the div
function checkContrast(color, text) {
  const luminance = chroma(color).luminance();
  if (luminance > 0.5) {
    text.style.color = 'rgb(51, 51, 51)';
  } else {
    text.style.color = 'rgb(255, 255, 255)';
  }
}

//* Initialize or update the sliders based on the color
function updateSliders(color, hue, brightness, saturation) {
  // Create the background scale for the saturation slider
  const noSat = color.set('hsl.s', 0);
  const fullSat = color.set('hsl.s', 1);
  const scaleSat = chroma.scale([noSat, fullSat]);
  // Brightness scale
  const midBright = color.set('hsl.l', 0.5);
  const scaleBright = chroma.scale(['black', midBright, 'white']);

  // add scales to the sliders
  saturation.style.background = `linear-gradient(to right, ${scaleSat(0)}, ${scaleSat(1)})`;
  brightness.style.background = `linear-gradient(to right, 
    ${scaleBright(0)},
    ${scaleBright(0.5)},
    ${scaleBright(1)})`;
  hue.style.background = `linear-gradient(to right, 
    rgb(204,75,75),
    rgb(204,204,75),
    rgb(75,204,75),
    rgb(75,204,204),
    rgb(75,75,204),
    rgb(204,75,204),
    rgb(204,75,75))`;
}

//* initialize slider positions based on the initial color array
function initSliderPositions() {
  // console.log('Init Slider Pos runs');
  sliders.forEach(slider => {
    if (slider.name === 'hue') {
      // Get the correct color from the array based on the data atttribute of the current slider
      // which will have the correct number for the index based on which group the slider is in
      const color = colorsArr[slider.getAttribute('data-hue')];
      // Extract the hue from that color and save it
      const hueValue = Math.floor(chroma(color).hsl()[0]);
      // console.log(hueValue);
      // set the current slider's value to the hue
      slider.value = hueValue;
    } else if (slider.name === 'saturation') {
      const color = colorsArr[slider.getAttribute('data-sat')];
      const saturationValue = Math.floor(chroma(color).hsl()[1] * 100) / 100;
      slider.value = saturationValue;
    } else {
      const color = colorsArr[slider.getAttribute('data-bright')];
      const brightnessValue = Math.floor(chroma(color).hsl()[2] * 100) / 100;
      slider.value = brightnessValue;
    }
  });
}

//* update the color based on slider input
function hslControls(e) {
  // Find for which group the slider has been activated
  const index =
    e.target.getAttribute('data-hue') ||
    e.target.getAttribute('data-bright') ||
    e.target.getAttribute('data-sat');

  // Grab the sliders and hue, sat, luminance depending on which group was activated
  sliderGroup = e.target.parentElement.querySelectorAll('input[type="range"]');
  const hue = sliderGroup[0].value;
  const brightness = sliderGroup[1].value;
  const saturation = sliderGroup[2].value;

  // Grab the initial color (because if we use the current color as an offset, things break when
  // we min or max the brightness, due to no hue)
  const bgColor = colorsArr[index];

  // Update the color of the backgorund based on the input of the sliders
  let color = chroma(bgColor).set('hsl.h', hue).set('hsl.s', saturation).set('hsl.l', brightness);
  colorDivs[index].style.background = color;

  // Update the colors on the sliders
  updateSliders(color, sliderGroup[0], sliderGroup[1], sliderGroup[2]);
}

//* update text on the color group once a value has been changed on the sliders within it
function updateColorText(index) {
  // Get the active group and derive the color of the background and the buttons as well as the text
  const activeDiv = colorDivs[index];
  const updatedColor = chroma(activeDiv.style.background);
  const icons = activeDiv.querySelectorAll('.controls button');
  const colorText = activeDiv.querySelector('h2');

  // Convert the color to hex and assign the text that color
  colorText.innerText = updatedColor.hex();
  // Check the contrast of the color and flip the color of the text and icons based on that
  checkContrast(updatedColor, colorText);
  for (icon of icons) {
    checkContrast(updatedColor, icon);
  }
}

//* Open the correct slider group for the color div which was chosen
function toggleSlider(index) {
  sliderContainers[index].classList.toggle('active');
}

//* Lock the color so it doesn't get overwritten as we generate new colors
function lockColor(e, index) {
  const lockSVG = e.target.children[0];
  const currentDiv = colorDivs[index];
  currentDiv.classList.toggle('locked');
  // Check which icon is on the SVG tag, and alternate on click
  if (lockSVG.classList.contains('fa-lock-open')) {
    e.target.innerHTML = '<i class="fas fa-lock"></i>';
  } else {
    e.target.innerHTML = '<i class="fas fa-lock-open"></i>';
  }
}

//* Open library dialogue
function toggleLibPanel() {
  const libWindow = libPanel.children[0];
  libPanel.classList.toggle('active');
  libWindow.classList.toggle('active');
}

//* Open copy to clipboaard dialogue when clicking the hex color code in the color group
function copyToClipbord(text) {
  // Create a temp textarea element and assign it the value from the hex
  const el = document.createElement('textarea');
  el.value = text.innerText;
  // Append the element to the html body, select it, and copy
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  console.log(`${el.value} was copied to clipboard`);
  // Remove it afterwards and assign an active class to our popup
  document.body.removeChild(el);
  const copyWindow = copyPanel.children[0];
  copyWindow.classList.add('active');
  copyPanel.classList.add('active');
}

//* Open palette save dialogue
function toggleSavePanel() {
  const saveWindow = savePanel.children[0];
  savePanel.classList.toggle('active');
  saveWindow.classList.toggle('active');
}

//* Save palette to localStorage
function savePalette() {
  // console.log('savePalette runs');
  // Check that a name has been written to the input
  if (saveInput.value) {
    // initialize name and palette
    const colors = [];
    const name = saveInput.value;
    const paletteNum = savedPalettes.length;

    console.log(paletteNum);
    // loop over each color adding them to the palette
    currentHexColors.forEach(hex => {
      colors.push(hex.innerText);
    });
    const palette = {name, colors, num: paletteNum};
    savedPalettes.push(palette);
    // console.log(currentPalette);
    // Save the palette with the name to localStorage
    localStorage.setItem('palettes', JSON.stringify(savedPalettes));
    addToLibrary(palette);
    console.log('Palette saved');
    saveInput.value = '';
  } else {
    console.log('Palette not saved');
  }
}

// initialization
startApp();
// console.log(savedPalettes);
