const Instascan = require('instascan');
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
        this.isLamp = false;
        this.isInit = false;
        this.scanner;

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
        document.removeEventListener('keyup', this.isEsc );
        this.scanner.stop();
    };

    enabledCamera() {
        this.initCamera();
        this.container_video.classList.add('active');

        Instascan.Camera.getCameras()
        .then( cameras => {
            if (cameras.length === 0) alert( 'No cameras found.' );
            else if ( cameras.length === 1 ) this.scanner.start(cameras[0]);
            else if ( cameras.length === 2 ) this.scanner.start(cameras[1]);
            document.addEventListener('keyup', this.isEsc );
        })
        .catch( error => console.error( error ));
    }

    initCamera() {
        if ( this.isInit ) return;
        this.isInit = true;
        this.scanner = new Instascan.Scanner({video: camera});

        this.scanner.addListener('scan', ( content ) => {
            console.log('qr code:', content);
            this.disabledCamera();
            this.qrCodeElement.innerHTML = content;
            setTimeout(() => {
                this.qrCodeElement.innerHTML = '';
            },CLEAR_QR_CODE_DATA);
        });
    }

    onOffLamp() {
        if ( !this.track ) return;
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