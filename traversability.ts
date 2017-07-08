class Point
{
    x: number;
    y: number;
}

type Mask = boolean[][];

class DisjointSetData
{
    parent: Point;
    rank: number;
}

// Implements the classic DisjointSet data structure
// on a set of non-negative Points.
// Optionally accepts an immutable inheritsFrom
// which this disjoint set will assume it is an extension of
// as a weak form of persistence. A poor choice of inheritsFrom
// can destroy the performance though.
class DisjointSets
{
    // Null for points not added, or when the value is 
    // inherited from inheritsFrom
    data: DisjointSetData[][];
    inheritsFrom: DisjointSets;

    constructor(inheritsFrom?: DisjointSets)
    {
        this.inheritsFrom = inheritsFrom;
        this.data = [];
    }

    private ensureSpace(p: Point)
    {
        if(p.x < 0)
            throw new Error("DisjointSets only supports non-negative points");
        if(p.y < 0)
            throw new Error("DisjointSets only supports non-negative points");
        while(this.data.length <= p.x)
        {
            this.data.push([]);
        }
        while(this.data[p.x].length <= p.y)
        {
            this.data[p.x].push(null);
        }
    }

    add(p: Point): boolean
    {
        this.ensureSpace(p);
        if(this.data[p.x][p.y] !== null)
            return false;
        this.data[p.x][p.y] = {parent: p, rank: 0};
        return true;
    }

    has(p: Point): boolean
    {
        return this.getComponentInner(p) !== null;
    }

    union(p1: Point, p2: Point)
    {
        let d1 = this.getComponentInner(p1);
        let d2 = this.getComponentInner(p2);
        if(d1 === null || d2 === null)
            throw new Error("Attempted to union points that are not in any set.")
        // d1 and d2 are the roots of respective tree,
        // need merging
        if(d1.rank < d2.rank)
        {
            this.ensureSpace(d1.parent);
            this.data[d1.parent.x][d1.parent.y] = d2;
        }
        if(d1.rank > d2.rank)
        {
            this.ensureSpace(d2.parent);
            this.data[d2.parent.x][d2.parent.y] = d1;
        }
        else
        {
            let d = {parent: d2.parent, rank: d2.rank + 1}
            this.ensureSpace(d1.parent);
            this.data[d1.parent.x][d1.parent.y] = d;
            this.ensureSpace(d2.parent);
            this.data[d2.parent.x][d2.parent.y] = d;
        }
    }

    // Finds the data corresponding to the points root,
    // or returns null if p is not in any set.
    getComponentInner(p:Point): DisjointSetData
    {
        if(p.x < 0)
            return null;
        if(p.y < 0)
            return null;

        this.ensureSpace(p);
        
        let d = this.data[p.x][p.y];
        if(d == null && this.inheritsFrom)
        {
            d = this.data[p.x][p.y] = this.inheritsFrom.getComponentInner(p);
        }

        if(d == null)
            return null;

        if(d.parent.x == p.x && d.parent.y == p.y)
            return d;
        let component = this.getComponentInner(d.parent);
        this.data[p.x][p.y] = component;
        return component;

    }

    getComponent(p:Point): string
    {
        let d = this.getComponentInner(p);
        return `${d.parent.x},${d.parent.y}`
    }
}

function scanWalkabilityRightwards(walkable: Mask, width: number, height: number): DisjointSets[]
{
    let setArray:DisjointSets[] = []
    let inheritSets:DisjointSets = undefined;
    for(let x=0;x<width;x++)
    {
        let set = new DisjointSets(inheritSets);
        for(let y=0;y<height;y++)
        {
            if(walkable[x][y])
            {
                set.add({x, y});
                if(x > 0 && walkable[x-1][y])
                    set.union({x: x-1, y}, {x, y})
                if(y > 0 && walkable[x][y-1])
                    set.union({x, y: y-1}, {x, y})
            }
        }
        setArray[x] = set;
        inheritSets = set;
    }
    return setArray;
}

function scanWalkabilityLeftwards(walkable: Mask, width: number, height: number): DisjointSets[]
{
    let setArray:DisjointSets[] = []
    let inheritSets:DisjointSets = undefined;
    for(let x=width-1;x>=0;x--)
    {
        let set = new DisjointSets(inheritSets);
        for(let y=0;y<height;y++)
        {
            if(walkable[x][y])
            {
                set.add({x, y});
                if(x + 1 < width && walkable[x+1][y])
                    set.union({x: x + 1, y}, {x, y})
                if(y > 0 && walkable[x][y-1])
                    set.union({x, y: y-1}, {x, y})
            }
        }
        setArray[x] = set;
        inheritSets = set;
    }
    return setArray;
}

class WouldBlockTraversalCalculator
{
    leftwards: DisjointSets[];
    rightwards: DisjointSets[];
    walkable: Mask;
    width: number;
    height: number;
    constructor(walkable: Mask, width: number, height: number)
    {
        this.walkable = walkable;
        this.width = width;
        this.height = height;
        this.leftwards = scanWalkabilityLeftwards(walkable, width, height);
        this.rightwards = scanWalkabilityRightwards(walkable, width, height);
    }

    wouldBlockTraversal(exits: Point[], solid: Mask, solidWidth: number, solidHeight: number, p: Point): boolean
    {
        let walkable = this.walkable;
        let width = this.width;
        let height = this.height;
        
        if(exits.length == 0)
            return false;

        function getOrDefault<T>(values:T[], i: number, def: T): T
        {
            if(i < 0 || i >= values.length)
                return def;
            return values[i];
        }
        let emptySet = new DisjointSets();
        let leftSide = getOrDefault(this.rightwards, p.x - 1, emptySet);
        let rightSide = getOrDefault(this.leftwards, p.x + solidWidth, emptySet);

        // Merged cointains just points in the same columns as the solid, plus the colums
        // next to those
        let merged = new DisjointSets();

        function copyFrom(fromSet: DisjointSets, p: Point)
        {
            let c = fromSet.getComponentInner(p);
            if(!c) return;
            merged.add(c.parent);
            merged.add(p);
            merged.union(c.parent, p);
        }

        for(let y=0;y<height;y++)
        {
            copyFrom(leftSide, {x: p.x - 1, y: y});
            copyFrom(rightSide, {x: p.x + solidWidth, y: y});
        }

        // Now, handle all interior connectivity (the only bit that is 
        // actually affected by solid
        function isWalkable(x:number, y: number): boolean
        {
            if(x<0 || y < 0 || x>=width || y>= height)
                return false;
            if(!walkable[x][y])
                return false;
            let tx = x - p.x;
            let ty = y - p.y;
            if(tx < 0 || ty < 0 || tx >= solidWidth || ty >= solidHeight)
                return true;
            return !solid[tx][ty];
        }
        for(let x=p.x-1;x<=p.x+solidWidth;x++)
        for(let y=0;y<height;y++)
        {
            if(isWalkable(x, y))
            {
                merged.add({x, y})
                if(x > p.x -1 && isWalkable(x-1, y))
                    merged.union({x, y}, {x: x-1, y: y})
                if(y > 0 && isWalkable(x, y-1))
                    merged.union({x, y}, {x: x, y: y-1})
            }
        }
        
        // merged / leftSide / rightSide now contain all the connectivity information
        // between them. Note that for points outside the range of merged,
        // we must check the relevant side *and* merged,
        // so that we get the correct parent if we unioned something from leftSide to rightSide.
        // merged has extra points to make this easy to query.
        function getComponent(point: Point): string
        {
            if(point.x < p.x-1)
            {
                let c = leftSide.getComponentInner(point);
                if(c == null)
                    return null;
                let mc = merged.getComponentInner(c.parent);
                if(mc != null)
                    c = mc;
                return `${c.parent.x},${c.parent.y}`
                
            }
            else if(point.x > p.x + solidWidth)
            {
                let c = rightSide.getComponentInner(point);
                if(c == null)
                    return null;
                let mc = merged.getComponentInner(c.parent);
                if(mc != null)
                    c = mc;
                return `${c.parent.x},${c.parent.y}`
            }
            else
            {
                let c = merged.getComponentInner(point);
                if(c == null)
                    return null;
                return `${c.parent.x},${c.parent.y}`
            }
        }

        let components = exits.map(getComponent);
        // Check that the unique components are exactly one, non-null, value
        let foundComponent = null;
        for(let component of components)
        {
            if(component == null)
                return true;
            else if(foundComponent == null)
                foundComponent = component;
            else if(foundComponent != component)
                return true;
        }
        return false;
    }
}


