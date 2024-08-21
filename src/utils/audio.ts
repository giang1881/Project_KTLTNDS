import * as THREE from 'three'

export class audio {
    listener: THREE.AudioListener
    sound: THREE.Audio
    constructor(filename: string){
        const listener = new THREE.AudioListener();

        // create the PositionalAudio object (passing in the listener)
        const sound = new THREE.Audio( listener );

        // load a sound and set it as the PositionalAudio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(filename, function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( true );
            // sound.setPlaybackRate(1)
            sound.setVolume(0.5);
            sound.play();
        }
        );
    }
}