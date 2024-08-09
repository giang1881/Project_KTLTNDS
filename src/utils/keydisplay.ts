export const W = 'w'
export const A = 'a'
export const S = 's'
export const D = 'd'
export const DIRECTIONS = [W, A, S, D]

export class KeyDisplay {

    map: Map<string, HTMLDivElement> = new Map()
    points: number = 0;
    startGame(): void {
        const startEvent = new Event('gameStart');
        document.dispatchEvent(startEvent);
    }

    constructor() {
        const w: HTMLDivElement = document.createElement("div")
        const a: HTMLDivElement = document.createElement("div")
        const s: HTMLDivElement = document.createElement("div")
        const d: HTMLDivElement = document.createElement("div")

        this.map.set(W, w)
        this.map.set(A, a)
        this.map.set(S, s)
        this.map.set(D, d)
        this.updatePointsDisplay();

        this.map.forEach( (v, k) => {
            v.style.color = 'black'
            v.style.fontSize = '100px'
            v.style.fontWeight = '800'
            v.style.position = 'absolute'
            v.textContent = k
        })

        this.updatePosition()

        this.map.forEach( (v, _) => {
            document.body.append(v)
        })
    }

    public updatePoints(newPoints: number): void {
        this.points = newPoints;
        this.updatePointsDisplay();
    }

    private updatePointsDisplay(): void {
        const pointsElement = document.getElementById('pointsDisplay');
        if (pointsElement) {
            pointsElement.textContent = `Points: ${this.points}`;
        } else {
            const pointsDiv = document.createElement('div');
            pointsDiv.id = 'pointsDisplay';
            pointsDiv.style.position = 'absolute';
            pointsDiv.style.top = '10px';
            pointsDiv.style.left = '10px';
            pointsDiv.style.color = 'white';
            pointsDiv.style.fontSize = '24px';
            pointsDiv.textContent = `Points: ${this.points}`;
            document.body.appendChild(pointsDiv);
        }
    }

    public updatePosition() {
        this.map.get(W).style.top = `${window.innerHeight - 200}px`
        this.map.get(A).style.top = `${window.innerHeight - 100}px`
        this.map.get(S).style.top = `${window.innerHeight - 100}px`
        this.map.get(D).style.top = `${window.innerHeight - 100}px`

        this.map.get(W).style.left = `${150}px`
        this.map.get(A).style.left = `${20}px`
        this.map.get(S).style.left = `${165}px`
        this.map.get(D).style.left = `${270}px`
    }

    public down (key: string) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'blue'
        }
    }

    public up (key: string) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'black'
        }
    }

    public showStartScene(): void {
        const startScene = document.createElement('div');
        startScene.id = 'startScene';
        startScene.style.position = 'absolute';
        startScene.style.top = '0';
        startScene.style.left = '0';
        startScene.style.width = '100%';
        startScene.style.height = '100%';
        startScene.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        startScene.style.display = 'flex';
        startScene.style.justifyContent = 'center';
        startScene.style.alignItems = 'center';
        startScene.style.cursor = 'pointer';

        const startText = document.createElement('div');
        startText.textContent = 'Start game';
        startText.style.color = 'white';
        startText.style.fontSize = '36px';

        startScene.appendChild(startText);
        document.body.appendChild(startScene);

        startScene.addEventListener('click', () => {
            startScene.remove();
            this.startGame()
        });

        
    }

}