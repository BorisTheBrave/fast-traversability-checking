// Setup canvas
let canvas = <HTMLCanvasElement>document.getElementById('canvas');
let ctx = canvas.getContext("2d");
let loadCount = 0;
function onLoadOne() {
    if(++loadCount == 2)
        onLoaded();
}
declare var imagePath: string;
let path = imagePath ? imagePath : "";
let bgImage = new Image();
bgImage.addEventListener("load", onLoadOne);
bgImage.src = path + "bigroom.png";
let blockImage = new Image();
blockImage.addEventListener("load", onLoadOne);
blockImage.src = path + "block_tiles.png";
ctx.fillText("Loading...", 0, 40);
canvas.onclick = onCanvasClick;

function onLoaded()
{
    clearBlocks();
}

// UI routines

// Size of walls
let margin = 32;
let tileSize = 16;
let width = 21;
let height = 11;
let blocks: boolean[][] = [];
let wouldBlock: boolean[][] = [];
for(let x=0;x<width;x++)
{
    blocks[x] = [];
    wouldBlock[x] = [];
}

function clearBlocks()
{
    for(let x=0;x<width;x++)
    for(let y=0;y<height;y++)
    {
        blocks[x][y] = false;
    }
    redraw();
}

function redraw()
{
    // Recompute wouldBlock
    let walkable: boolean[][] = [];
    let empty = true;
    for(let x=0;x<width;x++)
    {
        walkable[x] = [];
        for(let y=0;y<height;y++)
        {
            walkable[x][y] = !blocks[x][y];
            if(blocks[x][y])
                empty = false;
        }
    }
    let exits = [{x: 1, y: 0}, {x: 1, y: height-1}];
    // Skip if empty, so that we don't do any real computation on page load
    if(!empty)
    {
        let calc = new WouldBlockTraversalCalculator(walkable, width, height)
        // In the demo, we just place a single brick, but the code supports more.
        let solid = [[true]]

        
        for(let x=0;x<width;x++)
        for(let y=0;y<height;y++)
        {
            wouldBlock[x][y] = calc.wouldBlockTraversal(exits, solid, 1, 1, {x, y})
        }
    }
    else
    {
        
        for(let x=0;x<width;x++)
        for(let y=0;y<height;y++)
            wouldBlock[x][y] = false;
        for(let exit of exits)
            wouldBlock[exit.x][exit.y] = true;
    }
    // Draw everything

    ctx.drawImage(bgImage, 0, 0);
    for(let x=0;x<width;x++)
    for(let y=0;y<height;y++)
    {
        if(blocks[x][y])
        {
            let bits = (y > 0 && blocks[x][y-1] ? 1 : 0) +
                    (x > 0 && blocks[x-1][y] ? 2 : 0) +
                    (x + 1 < width && blocks[x+1][y] ? 4 : 0) +
                    (y + 1 < height && blocks[x][y+1] ? 8 : 0);
            ctx.drawImage(blockImage, bits * tileSize, 0, tileSize, tileSize, x * tileSize + margin, y * tileSize + margin, tileSize, tileSize);
        }
        if(wouldBlock[x][y])
        {
            ctx.fillStyle = "#00000088";
            ctx.fillRect(x * tileSize + margin, y * tileSize + margin, tileSize, tileSize);
        }
    }
}


function onCanvasClick(this: HTMLElement, event: MouseEvent)
{
    let x = Math.floor((event.offsetX - margin)/tileSize);
    let y = Math.floor((event.offsetY - margin)/tileSize);
    if(x >= 0 && x < width && y >= 0 && y < width)
    {
        blocks[x][y] = !blocks[x][y];
        redraw();
    }
}
