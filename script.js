// Set up Matter.js module aliases
const { Engine, Render, Runner, Bodies, Composite, World, Mouse, MouseConstraint, Events, Constraint, Body } = Matter;

// Create an engine and world
const engine = Engine.create();
const { world } = engine;

// Create a renderer
const render = Render.create({
    element: document.body,
    canvas: document.getElementById('world'),
    engine: engine,
    options: {
        width: window.innerWidth - 150,
        height: window.innerHeight,
        wireframes: false,
        background: '#ffffff'
    }
});

// Start the renderer and runner
Render.run(render);
Runner.run(Runner.create(), engine);

// Add ground
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, 50, {
    isStatic: true,
    render: { fillStyle: '#2e2e2e' }
});
World.add(world, ground);

// Load audio files
const grabSound = new Audio('grab.wav');
const hitSound = new Audio('hit.wav');
const blowSound = new Audio('blow.wav');

// Function to play sound with randomized pitch
function playSoundWithRandomPitch(sound) {
    sound.playbackRate = Math.random() * 0.6 + 0.4; // Randomize pitch between 0.4 and 1
    sound.currentTime = 0; // Reset sound to start to ensure it plays correctly
    sound.play();
}

// Add mouse control with events to play grab sound
const mouse = Mouse.create(render.canvas);
let mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});

World.add(world, mouseConstraint);

// Keep the mouse in sync with rendering
render.mouse = mouse;

// Add collision event to play hit sound
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        // Check if the collision involves any object with the ground or another object
        if (pair.bodyA === ground || pair.bodyB === ground ||
            (pair.bodyA !== ground && pair.bodyB !== ground)) {
            playSoundWithRandomPitch(hitSound);
        }
    });
});

// Functions to spawn different shapes
function spawnRectangle() {
    const rectangle = Bodies.rectangle(Math.random() * (window.innerWidth - 200) + 150, 50, 60, 40, {
        render: { fillStyle: '#3498db' }
    });
    World.add(world, rectangle);
}

function spawnCircle() {
    const circle = Bodies.circle(Math.random() * (window.innerWidth - 200) + 150, 50, 30, {
        render: { fillStyle: '#e74c3c' }
    });
    World.add(world, circle);
}

function spawnTriangle() {
    const triangle = Bodies.polygon(Math.random() * (window.innerWidth - 200) + 150, 50, 3, 40, {
        render: { fillStyle: '#2ecc71' }
    });
    World.add(world, triangle);
}

// Spawn a square
function spawnSquare() {
    const square = Bodies.rectangle(Math.random() * (window.innerWidth - 200) + 150, 50, 50, 50, {
        render: { fillStyle: '#f39c12' }
    });
    World.add(world, square);
}

// Spawn a bouncy ball
function spawnBouncyBall() {
    const bouncyBall = Bodies.circle(Math.random() * (window.innerWidth - 200) + 150, 50, 30, {
        restitution: 1, // Full bounce
        render: { fillStyle: '#9b59b6' }
    });
    World.add(world, bouncyBall);
}

// Spawn a stickman dummy
function spawnDummy() {
    const head = Bodies.circle(Math.random() * (window.innerWidth - 200) + 150, 50, 20, {
        isStatic: false,
        render: { fillStyle: '#000000' }
    });

    const body = Bodies.rectangle(head.position.x, head.position.y + 40, 20, 60, {
        isStatic: false,
        render: { fillStyle: '#000000' }
    });

    const leftArm = Bodies.rectangle(body.position.x - 25, body.position.y - 10, 10, 50, {
        angle: Math.PI / 6,
        isStatic: false,
        render: { fillStyle: '#000000' }
    });

    const rightArm = Bodies.rectangle(body.position.x + 25, body.position.y - 10, 10, 50, {
        angle: -Math.PI / 6,
        isStatic: false,
        render: { fillStyle: '#000000' }
    });

    const leftLeg = Bodies.rectangle(body.position.x - 10, body.position.y + 70, 10, 40, {
        isStatic: false,
        render: { fillStyle: '#000000' }
    });

    const rightLeg = Bodies.rectangle(body.position.x + 10, body.position.y + 70, 10, 40, {
        isStatic: false,
        render: { fillStyle: '#000000' }
    });

    // Add constraints for arms
    const leftArmConstraint = Constraint.create({
        bodyA: body,
        bodyB: leftArm,
        pointA: { x: -10, y: -20 },
        pointB: { x: 0, y: 25 },
        stiffness: 0.8
    });

    const rightArmConstraint = Constraint.create({
        bodyA: body,
        bodyB: rightArm,
        pointA: { x: 10, y: -20 },
        pointB: { x: 0, y: 25 },
        stiffness: 0.8
    });

    // Add constraints for legs
    const leftLegConstraint = Constraint.create({
        bodyA: body,
        bodyB: leftLeg,
        pointA: { x: -10, y: 30 },
        pointB: { x: 0, y: -20 },
        stiffness: 0.8
    });

    const rightLegConstraint = Constraint.create({
        bodyA: body,
        bodyB: rightLeg,
        pointA: { x: 10, y: 30 },
        pointB: { x: 0, y: -20 },
        stiffness: 0.8
    });

    // Add constraint between head and torso
    const headConstraint = Constraint.create({
        bodyA: head,
        bodyB: body,
        pointA: { x: 0, y: 20 },
        pointB: { x: 0, y: -30 },
        stiffness: 0.8
    });

    // Add all parts to the world
    World.add(world, [head, body, leftArm, rightArm, leftLeg, rightLeg, leftArmConstraint, rightArmConstraint, leftLegConstraint, rightLegConstraint, headConstraint]);
}

// Function to create a rope between two bodies
function createRope(bodyA, bodyB) {
    const options = {
        bodyA: bodyA,
        bodyB: bodyB,
        stiffness: 0.9,
        length: Math.hypot(bodyB.position.x - bodyA.position.x, bodyB.position.y - bodyA.position.y),
        render: {
            strokeStyle: '#000000' // Set rope color to black
        }
    };
    return Constraint.create(options);
}

// Toggle Paint Tool
let paintToolEnabled = false;
let anchorToolEnabled = false;
let ropeToolEnabled = false;
let imageToolEnabled = false;
let selectedBodies = [];

// Toggle Paint Tool
function togglePaintTool() {
    paintToolEnabled = !paintToolEnabled;
    const paintMenu = document.getElementById('paintMenu');

    if (paintToolEnabled) {
        disableDragging();
        paintMenu.classList.remove('hidden');
    } else {
        enableDragging();
        paintMenu.classList.add('hidden');
    }
}

// Toggle Anchor Tool
function toggleAnchorTool() {
    anchorToolEnabled = !anchorToolEnabled;

    if (anchorToolEnabled) {
        disableDragging();
    } else {
        enableDragging();
    }
}

// Toggle Rope Tool
function toggleRopeTool() {
    ropeToolEnabled = !ropeToolEnabled;
    selectedBodies = []; // Clear selected bodies

    if (ropeToolEnabled) {
        disableDragging();
    } else {
        enableDragging();
    }
}

// Toggle Image Tool
function toggleImageTool() {
    imageToolEnabled = !imageToolEnabled;
    const imageUpload = document.getElementById('imageUpload');

    if (imageToolEnabled) {
        imageUpload.classList.remove('hidden');
    } else {
        imageUpload.classList.add('hidden');
    }
}

// Handle image upload and add to the world
document.getElementById('imageUpload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'image/png') {
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = function() {
                const size = 60; // Desired size for the image
                const imgBody = Bodies.rectangle(
                    Math.random() * (window.innerWidth - 200) + 150,
                    50,
                    size,
                    size,
                    {
                        isStatic: false,
                        render: {
                            sprite: {
                                texture: image.src,
                                xScale: size / image.width,
                                yScale: size / image.height
                            }
                        }
                    }
                );
                World.add(world, imgBody);
            };
        };
        reader.readAsDataURL(file);
    }
});

// Event listener to handle painting, anchoring, and roping objects when tools are enabled
render.canvas.addEventListener('mousedown', (event) => {
    const mousePosition = mouse.position;
    const bodies = Composite.allBodies(world);
    const clickedBody = bodies.find(body => Matter.Bounds.contains(body.bounds, mousePosition));

    if (clickedBody && clickedBody !== ground) {
        if (paintToolEnabled) {
            const chosenColor = document.getElementById('colorPicker').value;
            clickedBody.render.fillStyle = chosenColor;
        } else if (anchorToolEnabled) {
            clickedBody.isStatic = !clickedBody.isStatic; // Toggle static state
            clickedBody.frictionAir = clickedBody.isStatic ? 0.0 : 0.1; // Adjust friction when anchored
        } else if (ropeToolEnabled) {
            if (selectedBodies.length < 2) {
                selectedBodies.push(clickedBody);
            }

            if (selectedBodies.length === 2) {
                const [bodyA, bodyB] = selectedBodies;
                const rope = createRope(bodyA, bodyB);
                World.add(world, rope);
                selectedBodies = []; // Clear selected bodies
            }
        }
    }
});

// Function to create a bomb object
function spawnBomb() {
    const bomb = Bodies.circle(Math.random() * (window.innerWidth - 200) + 150, 50, 20, {
        isStatic: false,
        render: { fillStyle: '#000000' }
    });
    World.add(world, bomb);

    // After 5 seconds, make the bomb explode
    setTimeout(() => {
        playSoundWithRandomPitch(blowSound);

        // Apply explosion force to nearby bodies
        const bodies = Composite.allBodies(world);
        bodies.forEach(body => {
            if (body !== bomb) {
                const distance = Math.hypot(body.position.x - bomb.position.x, body.position.y - bomb.position.y);
                if (distance < 200) { // Only affect nearby objects
                    Body.applyForce(body, body.position, {
                        x: (body.position.x - bomb.position.x) * 0.05,
                        y: (body.position.y - bomb.position.y) * 0.05
                    });
                }
            }
        });

        // Bomb remains in the world but only pushes objects
    }, 5000); // 5 seconds
}

// Function to clear all objects
function clearAll() {
    Composite.allBodies(world).forEach(body => {
        if (!['bomb'].includes(body.label)) {
            World.remove(world, body);
        }
    });
    Composite.allConstraints(world).forEach(constraint => {
        World.remove(world, constraint);
    });
}

// Event listener for the bomb button
document.getElementById('spawnBomb').addEventListener('click', spawnBomb);

// Add event listeners to buttons
document.getElementById('spawnRectangle').addEventListener('click', spawnRectangle);
document.getElementById('spawnCircle').addEventListener('click', spawnCircle);
document.getElementById('spawnTriangle').addEventListener('click', spawnTriangle);
document.getElementById('spawnSquare').addEventListener('click', spawnSquare);
document.getElementById('spawnBouncyBall').addEventListener('click', spawnBouncyBall);
document.getElementById('spawnDummy').addEventListener('click', spawnDummy);
document.getElementById('clearButton').addEventListener('click', clearAll);
document.getElementById('paintTool').addEventListener('click', togglePaintTool);
document.getElementById('anchorTool').addEventListener('click', toggleAnchorTool);
document.getElementById('ropeTool').addEventListener('click', toggleRopeTool);
document.getElementById('imageTool').addEventListener('click', toggleImageTool);
