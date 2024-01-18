import { Grid } from "./grid.js"
import { Tile } from "./tile.js"

const userDevice = navigator.userAgent

const gameBoard = document.getElementById('game-board')

const grid = new Grid(gameBoard)
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard))
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard))

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userDevice)) {
    // код для мобильных устройств
    // console.log('mobile')

    setupTouchInputOnce()

    function setupTouchInputOnce() {
        window.addEventListener('touchstart', handleTouchStart, {once: true})
        window.addEventListener('touchmove', handleTouchMove, {once: true})
    }

    let x1 = null
    let y1 = null


    async function handleTouchStart(event) {
        x1 = event.touches[0].clientX
        y1 = event.touches[0].clientY

        setupTouchInputOnce()
    }

    async function handleTouchMove(event) {
        if (!x1 || !y1) {
            return false
        }

        let x2 = event.touches[0].clientX
        let y2 = event.touches[0].clientY

        let xDiff = x2 - x1
        let yDiff = y2 - y1

        if (Math.abs(xDiff) > Math.abs(yDiff)) {

            if (xDiff > 0) {
                // console.log('right')  
                if(!canMoveRight()) {
                    return
                }
                await moveRight()
            } 
            else {
                // console.log('left')
                if(!canMoveLeft()) {
                    return
                }
                await moveLeft()
            } 
        } else {

            if (yDiff > 0) {
                // console.log('down')
                if(!canMoveDown()) {
                    return
                }
                await moveDown()
            } 
            else {
                // console.log('top')
                if(!canMoveUp()) {
                    return
                }
                await moveUp()
            } 
        }

        x1 = null
        y1 = null

        const newTile = new Tile(gameBoard)
        grid.getRandomEmptyCell().linkTile(newTile)
    
        if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
            await newTile.waitForAnimationEnd()
            alert('Game over! Try again!!!!')
            window.location.reload()
            return
        }

        setupTouchInputOnce()
    }
    

  } else {
    // код для обычных устройств

    setupInputOnce()

    function setupInputOnce() {
        window.addEventListener('keydown', handleInput, {once: true})
    }
    
    async function handleInput(event) {
        // console.log(event.key)
        switch (event.key) {
            case 'ArrowUp':
                if(!canMoveUp()) {
                    setupInputOnce()
                    return
                }
                await moveUp()
                break
            case 'ArrowDown':
                if(!canMoveDown()) {
                    setupInputOnce()
                    return
                }
                await moveDown()
                break
            case 'ArrowLeft':
                if(!canMoveLeft()) {
                    setupInputOnce()
                    return
                }
                await moveLeft()
                break
            case 'ArrowRight':
                if(!canMoveRight()) {
                    setupInputOnce()
                    return
                }
                await moveRight()
                break                        
        
            default:
                setupInputOnce()
                return
        }
    
        const newTile = new Tile(gameBoard)
        grid.getRandomEmptyCell().linkTile(newTile)
    
        if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
            await newTile.waitForAnimationEnd()
            alert('Game over! Try again!!!!')
            window.location.reload()
            return
        }
    
        setupInputOnce()
    }
}


async function moveUp() {
    await slideTiles(grid.cellsGroupedByColumn)
}

async function moveDown() {
    await slideTiles(grid.cellsGroupedByReversedColumn)
}

async function moveLeft() {
    await slideTiles(grid.cellsGroupedByRow)
}

async function moveRight() {
    await slideTiles(grid.cellsGroupedByReversedRow)
}

async function slideTiles(groupedCells) {
    const promises = []

    groupedCells.forEach(group => slideTilesInGroup(group, promises))

    await Promise.all(promises)

    grid.cells.forEach(cell => {
        cell.hasTileForMerge() && cell.mergeTiles()
    })
}

function slideTilesInGroup(group, promises) {
    for (let i = 1; i < group.length; i++) {
        if (group[i].isEmpty()) {
            continue
        }

        const cellWithTile = group[i]

        let targetCell
        let j = i - 1
        while (j >= 0 && group[j].canAccept(cellWithTile.linkedTile)) {
            targetCell = group[j]
            j--
        }

        if (!targetCell) {
            continue
        }

        promises.push(cellWithTile.linkedTile.waitForTransitionEnd())

        if (targetCell.isEmpty()) {
            targetCell.linkTile(cellWithTile.linkedTile)
        } else {
            targetCell.linkTileForMerge(cellWithTile.linkedTile)
        }

        cellWithTile.unlinkTile() 
    }    
}

function canMoveUp() {
    return canMove(grid.cellsGroupedByColumn)
}

function canMoveDown() {
    return canMove(grid.cellsGroupedByReversedColumn)
}

function canMoveLeft() {
    return canMove(grid.cellsGroupedByRow)
}

function canMoveRight() {
    return canMove(grid.cellsGroupedByReversedRow)
}

function canMove(groupedCells) {
    return groupedCells.some(group => canMoveInGroup(group))
}

function canMoveInGroup(group) {
    return group.some((cell, index) => {
        if (index === 0) {
            return false
        }

        if (cell.isEmpty()) {
            return false
        }

        const targetCell = group[index - 1]
        return targetCell.canAccept(cell.linkedTile)
    })
}

