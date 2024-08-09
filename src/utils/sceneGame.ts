import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


export class scene_game {
    scene : THREE.Scene
    orbitControls: OrbitControls
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer

    constructor(){
        this.scene = new THREE.Scene()
        // this.scene.add(new THREE.AxesHelper(100))

        this.scene.background= new THREE.Color(0xB3CBE5)
        const envTexture = new THREE.CubeTextureLoader().load(
            ["img/px_eso0932a.jpg", "img/nx_eso0932a.jpg", "img/py_eso0932a.jpg", "img/ny_eso0932a.jpg", "img/pz_eso0932a.jpg", "img/nz_eso0932a.jpg"])
        envTexture.mapping = THREE.CubeReflectionMapping
        this.scene.background=envTexture
        // CAMERA
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.y = 5;
        this.camera.position.z = 10;
        this.camera.position.x = -18;

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true

        // ORBIT CAMERA CONTROLS
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true
        this.orbitControls.enablePan = true
        this.orbitControls.minDistance = 50
        this.orbitControls.maxDistance = 100
        this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.05 // prevent camera below ground
        this.orbitControls.minPolarAngle = Math.PI / 4        // prevent top down view
        this.orbitControls.update();

        const dLight = new THREE.DirectionalLight('white', 0.6);
        dLight.position.x = 20;
        dLight.position.y = 30;
        dLight.castShadow = true;
        dLight.shadow.mapSize.width = 4096;
        dLight.shadow.mapSize.height = 4096;
        const d = 35;
        dLight.shadow.camera.left = - d;
        dLight.shadow.camera.right = d;
        dLight.shadow.camera.top = d;
        dLight.shadow.camera.bottom = - d;
        this.scene.add(dLight);
        const aLight = new THREE.AmbientLight('white', 0.4);
        this.scene.add(aLight);

        // ANIMATE
        document.body.appendChild(this.renderer.domElement);

    }
}