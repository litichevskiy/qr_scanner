const QrScanner = require('./utils/qr-scanner.js');
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