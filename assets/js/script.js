var state = 0, srcImage, images = [];

const update = () => {
    document.querySelector("#create-button").disabled = (state !== 3);
}

update();

document.querySelector("#state1").style.display = 'none';
document.querySelector("#state2").style.display = 'none';

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

    for(let index, value, x = 0; x < w; ++x) {
        for(let y = 0; y < h; ++y) {
            index = (w * y + x) << 2;

            value = (
                data[index    ] + 
                data[index + 1] + 
                data[index + 2]
            ) / 3;
    
            result += value; 
        }
    }
    
    return result / (w * h);
}

// step 3
document.querySelector("#create-button").addEventListener('click', ()=> {
    if(state === 3) {

        const w = parseInt(document.querySelector("#image-width").value);
        const h = parseInt(document.querySelector("#image-height").value);

        const siw = parseInt(document.querySelector("#pixel-width").value);
        const sih = parseInt(document.querySelector("#pixel-height").value);

        const values = [];
        var min = 255;
        var max = 0;

        // Get values
        var canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(srcImage, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        for(let index, value, x = 0; x < w; ++x) {
            for(let y = 0; y < h; ++y) {
                index = (w * y + x) << 2;
                value = (
                    data[index    ] + 
                    data[index + 1] + 
                    data[index + 2]
                ) / 3;
                values[w * y + x] = value; 
                if(min > value) min = value;
                if(max < value) max = value;
            }
        }

        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
        canvas.width  = w * siw;
        canvas.height = h * sih;
        
        for(let x = 0; x < w; x ++) {
            for(let y = 0; y < h; y ++) {
                var index = map(values[w * y + x], min, max, 0, images.length - 1);         
                index = Math.floor(index)
                ctx.drawImage(images[index], x * siw, y * sih, siw, sih);
            }
        }

        if(document.querySelector("#bg-mode").checked) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (i = 0; i < imgData.data.length; i += 4) {
                let colour = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
                imgData.data[i] = colour;
                imgData.data[i + 1] = colour;
                imgData.data[i + 2] = colour;
            }
            ctx.putImageData(imgData, 0, 0);
        }

        // Download
        var link = document.createElement('a');
        link.download = 'image.png';
        link.href = canvas.toDataURL()
        link.click();

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