const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scale = 20;
context.scale(scale, scale);
nextContext.scale(scale, scale);

const arena = createMatrix(10, 20);

const pieces = 'ILJOTSZ';
const colors = [
    null,
    'red', 'blue', 'orange', 'yellow', 'purple', 'green', 'cyan'
];

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;
let level = 1;
let highScore = 0; //

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    next: null,
    score: 0
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    switch (type) {
        case 'T': return [[0, 5, 0], [5, 5, 5], [0, 0, 0]];
        case 'O': return [[4, 4], [4, 4]];
        case 'L': return [[0, 0, 2], [2, 2, 2], [0, 0, 0]];
        case 'J': return [[3, 0, 0], [3, 3, 3], [0, 0, 0]];
        case 'I': return [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]];
        case 'S': return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
        case 'Z': return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += 10;

        if (player.score % 100 === 0) {
            level++;
            dropInterval -= 100; // Ускорение падения фигур
        }
    }
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    if (isPaused) return;

    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    if (isPaused) return;

    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    player.matrix = player.next || createPiece(pieces[pieces.length * Math.random() | 0]);
    player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        //
        if (player.score > highScore) {//
            highScore = player.score;
            saveHighScore(highScore);
        }//
        //
        arena.forEach(row => row.fill(0));
        player.score = 0;
        level = 1;
        dropInterval = 1000;
        updateScore();
    }
}

function update(time = 0) {
    if (!isPaused) {
        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        draw();
    } else {
        drawPaused();
    }
    requestAnimationFrame(update);
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawGrid(ctx) {
    ctx.strokeStyle = '#333';
    for (let x = 0; x < arena[0].length; x++) {
        for (let y = 0; y < arena.length; y++) {
            ctx.strokeRect(x, y, 1, 1);
        }
    }
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

    drawGrid(context);
    drawMatrix(arena, {x: 0, y: 0}, context);
    drawMatrix(player.matrix, player.pos, context);

    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width / scale, nextCanvas.height / scale);
    drawMatrix(player.next, {x: 1, y: 1}, nextContext);
}

function drawPaused() {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    context.fillStyle = 'white';
    context.font = '1px Arial';
    context.fillText('PAUSED', 3, 10);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('level').innerText = level;
    //
    document.getElementById('high-score').innerText = highScore;//
}

//
function loadHighScore() {
    fetch('/get-high-score')
        .then(response => response.json())
        .then(data => {
            highScore = data.highScore;
            updateScore();
        })
        .catch(error => console.error('Ошибка при загрузке максимального счета:', error));
}


function saveHighScore(score) {
    fetch('/save-high-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score })
    })
    .then(response => response.text())
    .then(message => console.log(message))
    .catch(error => console.error('Ошибка при сохранении максимального счета:', error));
}


//

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 81) {
        playerRotate(-1);
    } else if (event.keyCode === 87) {
        playerRotate(1);
    } else if (event.keyCode === 80) {
        isPaused = !isPaused;
    } else if (event.keyCode === 82) {
        playerReset();
    }
});

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}
//
loadHighScore();

playerReset();
updateScore();
update();
