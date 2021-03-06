var state = 0, srcImage, images = [];

const createButton = document.querySelector("#create-button");

const imgWidth    = document.querySelector("#image-width");
const imgheight   = document.querySelector("#image-height");
const pixelWidth  = document.querySelector("#pixel-width");
const pixelHeight = document.querySelector("#pixel-height");


const update = () => {
    createButton.disabled = (state !== 3);

    const w = parseInt(imgWidth.value);
    const h = parseInt(imgheight.value);
    const siw = parseInt(pixelWidth.value);
    const sih = parseInt(pixelHeight.value);

    document.querySelector("#info").innerText = `(${w * siw} x ${h * sih})`;
}


imgWidth  .addEventListener("change", update);
imgheight .addEventListener("change", update);
pixelWidth.addEventListener("change", update);
pixelHeight.addEventListener("change", update);

update();

document.querySelector("#state1").style.display = 'none';
document.querySelector("#state2").style.display = 'none';
document.querySelector("#modal").style.display = 'none';

// step 1
const button1 = document.querySelector("#src-file");
button1.addEventListener("change", (e)=> {
    const files = e.target.files;
    if (files && files.length) {
        var fileReader = new FileReader();
        fileReader.onload = function () {
            createImage(fileReader.result).then((img) => {

                srcImage = img;

                state |= 1; 
                update();

                document.querySelector("#state1").src = 'assets/icons/ok.svg';
                document.querySelector("#state1").style.display = 'block';
                
            }).catch((reason)=> { // Error loading image

                state &= ~1;
                update();

                document.querySelector("#state1").src = 'assets/icons/nok.svg';
                document.querySelector("#state1").style.display = 'block';

            })
        }
        fileReader.readAsDataURL(files[0]);
    }
});

// step 2
const button2 = document.querySelector("#images");
button2.addEventListener("change", (e)=> {
    const files = e.target.files;
    if (files && files.length) {
        images = [];
        const promises = [];
        for(let i = 0; i < files.length; ++i) {
            const promise = new Promise((resolve, reject)=> {
                var fileReader = new FileReader();
                fileReader.onload = function () {
                    createImage(fileReader.result).then((img) => {
                        img.score = scoreImage(img);
                        images.push(img);
                        resolve();
                    }).catch((reason)=> { // Error loading image
                        reject(reason);
                    })
                }
                fileReader.readAsDataURL(files[i]);
            });
            promises.push(promise);
        }
        Promise.all(promises).then(()=> {

            // sort images
            images = images.sort((a, b)=> {
                return a.score - b.score;
            });

            state |= 2;
            update();
            document.querySelector("#state2").src = 'assets/icons/ok.svg';
            document.querySelector("#state2").style.display = 'block';

        }).catch((reason)=> {
            state &= ~2;
            update();
            document.querySelector("#state2").src = 'assets/icons/nok.svg';
            document.querySelector("#state2").style.display = 'block';
        });
    }
})

const scoreImage = (img) => {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const w = img.width;
    const h = img.height;
    
    canvas.width  = w;
    canvas.height = h;
  
    ctx.drawImage(img, 0, 0, w, h);

    let result = 0;
    const data = ctx.getImageData(0, 0, w, h).data;
    for(let i = 0; i < data.length; i += 4) {
        result += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return result / data.length;
}

// step 3
document.querySelector("#create-button").addEventListener('click', ()=> {
    if(state === 3) {

        document.querySelector("#modal").style.display = 'flex';

        setTimeout(()=> {

            try {

                const w   = parseInt(imgWidth.value);
                const h   = parseInt(imgheight.value);
                const siw = parseInt(pixelWidth.value);
                const sih = parseInt(pixelHeight.value);
            
                const values = [];
                var min = 255;
                var max = 0;
            
                // Get values
                var canvas = document.createElement("canvas");
                canvas.width  = w;
                canvas.height = h;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(srcImage, 0, 0, w, h);
                let data = ctx.getImageData(0, 0, w, h).data;
                for (let j = 0, i = 0; i < data.length; ++j, i += 4) {
                    const value = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    values[j] = value;
                    if(min > value) min = value;
                    if(max < value) max = value;
                }
            
                canvas = document.createElement("canvas");
                ctx = canvas.getContext("2d");
                canvas.width  = w * siw;
                canvas.height = h * sih;
                
                for(let x = 0; x < w; x ++) {
                    for(let y = 0; y < h; y ++) {
                        var index = map(values[w * y + x], min, max, 0, images.length - 1);         
                        ctx.drawImage(images[Math.round(index)], x * siw, y * sih, siw, sih);
                    }
                }
            
                if(document.querySelector("#bg-mode").checked) {
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    data = imgData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = data[i + 1] = data[i + 2] = ((data[i] + data[i + 1] + data[i + 2]) / 3);
                    }
                    ctx.putImageData(imgData, 0, 0);
                }
            
                // Download
                var link = document.createElement('a');
                link.download = 'image.png';
                link.href = canvas.toDataURL()
                link.click();

            } catch (error) {
                alert("Error generating image!");
            }

            document.querySelector("#modal").style.display = 'none';

        }, 100);
       
    }
});

function map(value, fromMin, fromMax, toMin, toMax) {
    if (value < fromMin) value = fromMin;
    else if (value > fromMax) value = fromMax;
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}

const createImage = (src) => {
    const img = new Image();
    const promise = new Promise((resolve, reject) => {
       img.onload = function() {
            resolve(img);
       };
       img.onerror = function() {
            reject("Error loading image: " + src);
       }
    })
    img.src = src;
    return promise;
}
