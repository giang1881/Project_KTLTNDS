import { CharacterControls, CONTROLLER_BODY_RADIUS } from './utils/characterControls';
import { KeyDisplay } from './utils/keydisplay';
import { RigidBody, World,Collider } from '@dimforge/rapier3d';
import * as THREE from 'three';
import { BoxBufferGeometry, MeshPhongMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene_game } from './utils/sceneGame';
import { audio } from './utils/audio';

// SCENE
const scene = new scene_game()

// AUDIO
const listener = new audio('models/space.mp3');
scene.camera.add(listener.listener);
// MODEL WITH ANIMATIONS
var characterControls: CharacterControls
var threeFloor: THREE.Mesh
let groundBody: RigidBody

// key presssed to move model
const keysPressed: any = {}
const keyDisplayQueue = new KeyDisplay();
keyDisplayQueue.showStartScene()


document.addEventListener('keydown', (event) => {
    keyDisplayQueue.down(event.key)
    keysPressed[event.key.toLowerCase()] = true
}, false);
document.addEventListener('keyup', (event) => {
    keyDisplayQueue.up(event.key);
    keysPressed[event.key.toLowerCase()] = false
}, false);

// RESIZE HANDLER
function onWindowResize() {
    scene.camera.aspect = window.innerWidth / window.innerHeight;
    scene.camera.updateProjectionMatrix();
    scene.renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

import('@dimforge/rapier3d').then(RAPIER => {

    function body(scene: THREE.Scene, world: World,
        bodyType: 'dynamic' | 'static' | 'kinematicPositionBased',
        colliderType: 'cube' | 'sphere' | 'cylinder' | 'cone', dimension: any,
        translation: { x: number, y: number, z: number },
        rotation: { x: number, y: number, z: number },
        color: string): { rigid: RigidBody, mesh: THREE.Mesh } {

        let bodyDesc

        if (bodyType === 'dynamic') {
            bodyDesc = RAPIER.RigidBodyDesc.dynamic();
        } else if (bodyType === 'kinematicPositionBased') {
            bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        } else if (bodyType === 'static') {
            bodyDesc = RAPIER.RigidBodyDesc.fixed();
            bodyDesc.setCanSleep(false);
        }

        if (translation) {
            bodyDesc.setTranslation(translation.x, translation.y, translation.z)
        }
        if(rotation) {
            const q = new THREE.Quaternion().setFromEuler(
                new THREE.Euler( rotation.x, rotation.y, rotation.z, 'XYZ' )
            )
            bodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
        }

        let rigidBody = world.createRigidBody(bodyDesc);

        let collider;
        if (colliderType === 'cube') {
            collider = RAPIER.ColliderDesc.cuboid(dimension.hx, dimension.hy, dimension.hz);
        } else if (colliderType === 'sphere') {
            collider = RAPIER.ColliderDesc.ball(dimension.radius);
        } else if (colliderType === 'cylinder') {
            collider = RAPIER.ColliderDesc.cylinder(dimension.hh, dimension.radius);
        } else if (colliderType === 'cone') {
            collider = RAPIER.ColliderDesc.cone(dimension.hh, dimension.radius);
            // cone center of mass is at bottom
            collider.centerOfMass = {x:0, y:0, z:0}
        }
        world.createCollider(collider, rigidBody.handle);

        let bufferGeometry;
        if (colliderType === 'cube') {
            bufferGeometry = new BoxBufferGeometry(dimension.hx * 2, dimension.hy * 2, dimension.hz * 2);
        } else if (colliderType === 'sphere') {
            bufferGeometry = new THREE.SphereBufferGeometry(dimension.radius, 32, 32);
        } else if (colliderType === 'cylinder') {
            bufferGeometry = new THREE.CylinderBufferGeometry(dimension.radius,dimension.radius, dimension.hh * 2,  32, 32);
        } else if (colliderType === 'cone') {
            bufferGeometry = new THREE.ConeBufferGeometry(dimension.radius, dimension.hh * 2,  
                32, 32);
        }

        const threeMesh = new THREE.Mesh(bufferGeometry, new MeshPhongMaterial({ color: color }));
        threeMesh.castShadow = true;
        threeMesh.receiveShadow = true;
        scene.add(threeMesh);
        

        return { rigid: rigidBody, mesh: threeMesh };
    }

    function generateTerrain(nsubdivs: number, scale: { x: number, y: number, z: number }) {
        let heights: number[] = []
        const textureLoader = new THREE.TextureLoader();
        const sandBaseColor = textureLoader.load("img/Sand_002_COLOR.jpg");
        const sandNormalMap = textureLoader.load("img/Sand_002_NRM.jpg");
        const sandHeightMap = textureLoader.load("img/Sand_002_DISP.jpg");
        const sandAmbientOcclusion = textureLoader.load("img/Sand_002_OCC.jpg");
        // three plane
        threeFloor = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(scale.x, scale.z, nsubdivs, nsubdivs),
            new THREE.MeshStandardMaterial({
                map: sandBaseColor, normalMap: sandNormalMap,
                displacementMap: sandHeightMap, displacementScale: 0.1,
                aoMap: sandAmbientOcclusion
            }));
        threeFloor.rotateX(- Math.PI / 2);
        threeFloor.receiveShadow = true;
        threeFloor.castShadow = true;
        scene.scene.add(threeFloor);
    
        // add height data to plane
        const vertices = threeFloor.geometry.attributes.position.array;
        const dx = scale.x / nsubdivs;
        const dy = scale.z / nsubdivs;
        // store height data in map column-row map
        const columsRows = new Map();
        for (let i = 0; i < vertices.length; i += 3) {
            // translate into colum / row indices
            let row = Math.floor(Math.abs((vertices as any)[i] + (scale.x / 2)) / dx);
            let column = Math.floor(Math.abs((vertices as any)[i + 1] - (scale.z / 2)) / dy);
            // generate height for this column & row
            const randomHeight = Math.random();
            (vertices as any)[i + 2] = scale.y * randomHeight;
            // store height
            if (!columsRows.get(column)) {
                columsRows.set(column, new Map());
            }
            columsRows.get(column).set(row, randomHeight);
        }
        threeFloor.geometry.computeVertexNormals();

        // store height data into column-major-order matrix array
        for (let i = 0; i <= nsubdivs; ++i) {
            for (let j = 0; j <= nsubdivs; ++j) {
                heights.push(columsRows.get(j).get(i));
            }
        }
    
        let groundBodyDesc = RAPIER.RigidBodyDesc.fixed();
        groundBody = world.createRigidBody(groundBodyDesc);
        let groundCollider = RAPIER.ColliderDesc.heightfield(
            nsubdivs, nsubdivs, new Float32Array(heights), scale
        );
        world.createCollider(groundCollider, groundBody.handle);
    }

    // Use the RAPIER module here.
    let gravity = { x: 0.0, y: -9.8, z: 0.0 };
    let world = new RAPIER.World(gravity);

    // Bodys
    const bodys: { rigid: RigidBody, mesh: THREE.Mesh }[] = [];

    // Create Ground.
    let nsubdivs = 20;
    let scale = new RAPIER.Vector3(70.0, 3.0, 70.0);
    generateTerrain(nsubdivs, scale);
    document.addEventListener('gameStart', () => {
        makeBall()
    });

    function makeBall(){
        for (let i = 0; i < 10; i++) {
            const sphereBody = body(scene.scene, world, 'dynamic', 'sphere',
                    { radius: 0.7 }, { x: randomIntFromInterval(-30,30), y: randomIntFromInterval(30,40), z:  randomIntFromInterval(-30,30) },
                    { x: 0, y: 1, z: 0 }, 'red');
                bodys.push(sphereBody);
        }
        setTimeout(makeBall, 2000);
    }

    const cubeBody = body(scene.scene, world, 'dynamic', 'cube',
        { hx: 0.5, hy: 0.5, hz: 0.5 }, { x: randomIntFromInterval(-30,30), y: 15, z: randomIntFromInterval(-30,30) },
        { x: 0, y: 0.4, z: 0.7 }, 'yellow');
    // bodys.push(cubeBody);

    function randomIntFromInterval(min: number, max: number): number { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function restartGame() {
        window.location.reload(); 
    }

    var characterCollider: Collider;

    // character controller
    new GLTFLoader().load('models/ok.glb', function (gltf) {
        const model = gltf.scene;
        model.traverse(function (object: any) {
            if (object.isMesh) object.castShadow = true;
        });

        scene.scene.add(model);
        // model.add(new THREE.AxesHelper(100))

        const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap: Map<string, THREE.AnimationAction> = new Map()
        gltfAnimations.filter(a => a.name != 'TPose').forEach((a: THREE.AnimationClip) => {
            animationsMap.set(a.name, mixer.clipAction(a))
        })
    
        // RIGID BODY
        let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(-1, 3, 1)
        let rigidBody = world.createRigidBody(bodyDesc);
        let dynamicCollider = RAPIER.ColliderDesc.ball(CONTROLLER_BODY_RADIUS).setSensor(true);
        characterCollider=world.createCollider(dynamicCollider, rigidBody.handle);
        characterCollider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

        characterControls = new CharacterControls(model, mixer, 
            animationsMap, scene.orbitControls, 
            scene.camera,  'Idle',
            new RAPIER.Ray( 
                { x: 0, y: 0, z: 0 },
                { x: 0, y: -1, z: 0} 
            ), rigidBody)
    });

    const clock = new THREE.Clock();

    // Game loop.
    let gameLoop = () => {
        let deltaTime = clock.getDelta();

        if (characterControls) {
            characterControls.update(world, deltaTime, keysPressed);
        }

        // Step the simulation forward.  
        let eventQueue = new RAPIER.EventQueue(true);
        world.step(eventQueue);
        
        // update 3d world with physical world
        bodys.forEach(body => {
            let position = body.rigid.translation();
            let rotation = body.rigid.rotation();

            body.mesh.position.x = position.x
            body.mesh.position.y = position.y
            body.mesh.position.z = position.z

            body.mesh.setRotationFromQuaternion(
                new THREE.Quaternion(rotation.x,
                    rotation.y,
                    rotation.z,
                    rotation.w));
        });

        let position = cubeBody.rigid.translation();
        let rotation = cubeBody.rigid.rotation();
        cubeBody.mesh.position.x = position.x
        cubeBody.mesh.position.y = position.y
        cubeBody.mesh.position.z = position.z
        cubeBody.mesh.setRotationFromQuaternion(
            new THREE.Quaternion(rotation.x,
                rotation.y,
                rotation.z,
                rotation.w));
    

        if (characterCollider) {
            const characterColliderHandle = characterCollider.handle;
            for (const body of bodys) {
                const ballColliderHandle = body.rigid.handle;
                const intersection = world.intersectionPair(characterColliderHandle, ballColliderHandle);
                if (intersection) {
                    // scene.camera.add(listener2.listener);
                    const listener2 = new audio('models/end.mp3');
                    setTimeout(restartGame,500);
                }
            }
                const cubeColliderHandle = cubeBody.rigid.handle;
                const intersectionCube = world.intersectionPair(characterColliderHandle, cubeColliderHandle);
                if (intersectionCube) {
                    keyDisplayQueue.points++;
                    keyDisplayQueue.updatePoints(keyDisplayQueue.points);
                    // scene.scene.remove(cubeBody.mesh);
                    cubeBody.rigid.setTranslation({x: randomIntFromInterval(-30, 30),y: 15,z: randomIntFromInterval(-30, 30)},true);
                }
        }

        scene.orbitControls.update()
        scene.renderer.render(scene.scene, scene.camera);
        // threeFloor.rotateZ(0.001)
        setTimeout(gameLoop, 16);
    };

    gameLoop();
})





