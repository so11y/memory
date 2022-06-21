class Chunk {
  start: number;
  end: number;
  original: string = "";
  content: string = "";
  intro: string = "";
  outro: string = "";
  next?: Chunk;
  previous?: Chunk;
  edited: boolean = false;
  constructor(start: number, end: number, content: string) {
    this.original = content;
    this.start = start;
    this.content = content;
    this.end = end;
  }

  contain(index: number) {
    return index >= this.start && index <= this.end;
  }
  split(index: number) {
    const sliceIndex = index - this.start;
    const originalBefore = this.original.slice(0, sliceIndex);
    const originalAfter = this.original.slice(sliceIndex);
    this.original = originalBefore;
    const newChunk = new Chunk(index, this.end, originalAfter);
    this.end = index;
    this.content = originalBefore;
    newChunk.next = this.next;
    newChunk.previous = this;
    this.next = newChunk;
    return newChunk;
  }

  toString() {
    return this.intro + this.content + this.outro;
  }
  edit(content: string) {
    this.content = content;
    this.edited = true;
  }
  remove() {
    this.content = "";
    this.intro = "";
    this.outro = "";
  }
}

const splitChunk = (m: MagicString, index: number) => {
  if (m.byteStart[index] || m.byteEnd[index]) {
    return;
  }
  let pervChunk = m.prevChunk;
  while (pervChunk) {
    if (pervChunk.contain(index)) {
      chunkLink(m, pervChunk, index);
      return;
    }
    pervChunk = pervChunk.next;
  }
};

const chunkLink = (m: MagicString, chunk: Chunk, index: number) => {
  if (chunk.edited && chunk.content.length) {
    throw new Error(`Cannot split a chunk that has already been edited`);
  }
  const newChunk = chunk.split(index);
  m.byteEnd[index] = chunk;
  m.byteStart[index] = newChunk;
  m.byteEnd[newChunk.end] = newChunk;
  m.prevChunk = chunk;
};

class MagicString {
  byteStart: Record<string, Chunk> = {};
  byteEnd: Record<string, Chunk> = {};
  prevChunk: Chunk;
  firstChunk: Chunk;
  intro: string = "";
  outro: string = "";
  constructor(content: string) {
    const chunk = new Chunk(0, content.length, content);
    this.byteStart[0] = chunk;
    this.byteEnd[content.length] = chunk;
    this.prevChunk = chunk;
    this.firstChunk = chunk;
  }

  overwrite(start: number, end: number, content: string) {
    splitChunk(this, start);
    splitChunk(this, end);
    const first = this.byteStart[start];
    if (first) {
      first.edit(content);
    }
  }

  toString() {
    let str = this.intro;
    let chunk = this.firstChunk;
    while (chunk) {
      str += chunk.toString();
      chunk = chunk.next;
    }
    return str + this.outro;
  }

  prepend(content: string) {
    this.intro += content;
  }
  append(content: string) {
    this.outro += content;
  }
  remove(start: number, end: number) {
    if (!this.byteStart[start]) splitChunk(this, start);
    if (!this.byteEnd[end]) splitChunk(this, end);

    [this.byteStart[start], this.byteEnd[end]].forEach((chunk) =>
      chunk.remove()
    );
  }
}

const s = new MagicString("var a =50;");

s.overwrite(0, 3, " 你好 ");
s.overwrite(3, 4, " good ");

s.prepend("幹你");
s.append("老師");
s.remove(0, 3);
console.log(s.toString());
