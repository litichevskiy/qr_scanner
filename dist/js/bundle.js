/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
module.exports = __webpack_require__(4);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

let scanner = new ( __webpack_require__(2) );
// let scanner = new ( require('./Scanner-2') );

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

const QrScanner = __webpack_require__(3);
const CLEAR_QR_CODE_DATA = 2500; //ms

class Scanner {
    constructor() {
        if( !checkSupported() ) return alert('User Media API not supported.');

        this.video = document.querySelector('#camera');
        this.container_video = document.querySelector('.container_video');
        this.startScan = document.querySelector('.start');
        this.stopScan = document.querySelector('.stop');
        this.qrCodeElement = document.querySelector('.qrCode');
        this.lamp = document.querySelector('.button_lamp');
        this.track;
        this.qrScanner;
        this.isLamp = false;

        this.enabledCamera = this.enabledCamera.bind( this );
        this.disabledCamera = this.disabledCamera.bind( this );
        this.onOffLamp = this.onOffLamp.bind( this );
        this.isEsc = this.isEsc.bind( this );
        this.startScan.addEventListener('click', this.enabledCamera );
        this.stopScan.addEventListener('click', this.disabledCamera );
        this.lamp.addEventListener('click', this.onOffLamp );
    }

    disabledCamera() {
        this.container_video.classList.remove('active');
        this.track.stop();
        this.qrScanner.stop();
        document.removeEventListener('keyup', this.isEsc );
        setTimeout(() => {
            this.qrCodeElement.innerHTML = '';
        },CLEAR_QR_CODE_DATA);
    };

    enabledCamera() {
        this.container_video.classList.add('active');
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
            }
        })
        .then( stream => {
            this.video.srcObject = stream;
            this.track = stream.getVideoTracks()[0];

            this.video.addEventListener('loadedmetadata', () => {
                document.addEventListener('keyup', this.isEsc );
                if ( this.qrScanner ) this.qrScanner.start();
                else{
                    this.qrScanner = new QrScanner(this.video, result => {
                        this.disabledCamera();
                        console.log('qr code:', result);
                        this.qrCodeElement.innerHTML = `result: ${result}`;
                    });
                }
            });
        })
        .catch(error => {
            console.error('getUserMedia() failed: ', error );
            alert( 'No cameras found.' );
            this.container_video.classList.remove('active');
        });
    }

    onOffLamp() {
        let settings = this.track.getCapabilities();
        if( settings.hasOwnProperty('torch') ) {
            this.isLamp = !this.isLamp;
            this.track.applyConstraints({ advanced: [{torch: this.isLamp}] });
        }
    }

    isEsc( event ) {
        if( event.keyCode === 27 ) this.disabledCamera();
    }
};

function checkSupported () {
    if (!navigator.getUserMedia && !navigator.webkitGetUserMedia &&
        !navigator.mozGetUserMedia && !navigator.msGetUserMedia) {
        return false;
    }

    return true;
};

module.exports = Scanner;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

class QrScanner {
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._active = true;
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    _scanFrame() {

        if (this.$video.paused || this.$video.ended ) return false;
        requestAnimationFrame(() => {
            if( !this._active ) return;
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });
    }

    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 }
        }, {
            width: { min: 768 }
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => constraint.facingMode = facingMode);
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift()
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(this._offTimeout);
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = setTimeout(() => {
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000);
    }

    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode==='user'? -1 : 1;
        this.$video.style.transform = 'scaleX(' + scaleFactor + ')';
    }

    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue }
        });
    }

    /* async */
    static scanImage(imageOrFileOrUrl, sourceRect=null, worker=null, canvas=null, fixedCanvasSize=false,
                     alsoTryWithoutSourceRect=false) {
        const promise = new Promise((resolve, reject) => {

            worker = worker || new Worker(QrScanner.WORKER_PATH);
            let timeout, onMessage, onError;
            onMessage = event => {
                if (event.data.type !== 'qrResult') {
                    return;
                }
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                clearTimeout(timeout);
                if (event.data.data !== null) {
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                worker.postMessage({
                    type: 'decode',
                    data: imageData
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        } else {
            return promise;
        }
    }

    /* async */
    static _getImageData(image, sourceRect=null, canvas=null, fixedCanvasSize=false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y? sourceRect.y : 0;
        const sourceRectWidth = sourceRect && sourceRect.width? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height? sourceRect.height : image.height || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(image, sourceRectX, sourceRectY, sourceRectWidth, sourceRectHeight, 0, 0, canvas.width, canvas.height);
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /* async */
    static _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement || imageOrFileOrUrl instanceof HTMLVideoElement
            || window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap
            || window.OffscreenCanvas && imageOrFileOrUrl instanceof window.OffscreenCanvas) {
            return Promise.resolve(imageOrFileOrUrl);
        } else if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } else if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            ||  typeof(imageOrFileOrUrl)==='string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        } else {
            return Promise.reject('Unsupported image type.');
        }
    }

    /* async */
    static _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth!==0) {
                // already loaded
                resolve();
            } else {
                let onLoad, onError;
                onLoad = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    resolve();
                };
                onError = () => {
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    reject('Image load error');
                };
                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = './workers/qr-scanner-worker.js';

module.exports = QrScanner;
/** @preserve @asset(/libraries/qr-scanner/qr-scanner-worker.min.js) */

/***/ }),
/* 4 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map