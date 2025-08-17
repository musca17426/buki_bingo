"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const WeaponSchema = zod_1.z.object({
    name: zod_1.z.string(),
    modes: zod_1.z.boolean(),
    type: zod_1.z.string(),
});
const WeaponCellSchema = zod_1.z.object({
    name: zod_1.z.string(),
    done: zod_1.z.boolean(),
    type: zod_1.z.string().optional(),
});
const BingoSchema = zod_1.z.object({
    mode: zod_1.z.string(),
    board: zod_1.z.array(WeaponCellSchema),
    size: zod_1.z.number(),
    cellCount: zod_1.z.number(),
    bingo_lines: zod_1.z.number(),
});
let allWeapons = [];
let freeCell = {
    name: "FREE",
    done: true,
    // type: mode,
};
function loadWeaponData() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch("./data/weapon_v10.json");
        allWeapons = yield res.json();
        // 完了後に generateBingo を呼べるように
        const button = document.getElementById("generate-button");
        button.disabled = false;
    });
}
class Bingo {
    constructor(mode, board, size, bingo_lines) {
        this.mode = mode;
        this.board = board;
        this.size = size;
        this.cellCount = size * size;
        this.bingo_lines = bingo_lines;
    }
    toJSON() {
        return JSON.stringify({
            mode: this.mode,
            board: this.board,
            size: this.size,
            // cellCount: this.cellCount,
            bingo_lines: this.bingo_lines,
        });
    }
    static fromJSON(json) {
        const obj = JSON.parse(json);
        const result = BingoSchema.safeParse(obj);
        if (!result.success)
            return null;
        return new Bingo(result.data.mode, result.data.board, result.data.size, result.data.bingo_lines);
    }
    generateBingo() {
        // UIからモードとサイズを取得
        const mode = document.getElementById("mode-select").value;
        const size = parseInt(document.getElementById("size-select").value, 10);
        const cellCount = size * size;
        // 指定モードのブキ一覧を取得
        let candidates = allWeapons.filter(w => w.modes.includes(mode));
        // ブキ一覧を新しいボードに反映する
        let newBoard = candidates.map(w => ({
            name: w.name,
            done: false,
            type: w.type
        }));
        // ↑が間違ってたらこっちを採用する
        // let newBoard: WeaponCell[] = Array();
        // for (let weapon of candidates) {
        //     let w: WeaponCell = {
        //         name: weapon.name,
        //         done: false,
        //         type: mode,
        //     };
        //     newBoard.push(w);
        //     }
        // 足りない分だけFREEマスで補充する
        if (candidates.length < cellCount) {
            for (let i = 0; i < (cellCount - candidates.length); i++) {
                newBoard.push(freeCell);
            }
        }
        // ボードをシャッフルして、必要な分だけスライスで切り出す
        newBoard = shuffleArray(newBoard).slice(0, cellCount);
        // 情報をBingoに登録する
        this.mode = mode;
        this.board = newBoard;
        this.size = size;
        this.cellCount = cellCount;
        this.bingo_lines = this.checkAllBingoLines();
        // LocalStorageに保存する
        saveProgress();
        // 描画
        render();
    }
    checkNewBingoLines(r, c) {
        // 新しくdone = true になったセルが関係するビンゴ列をチェックする。
        // done = false -> true の際に呼ぶこと
        // newCell.done = true を前提とする。
        // 横
        let flag = true;
        for (let j = 0; j < this.size; j++) {
            flag && (flag = this.board[r * this.size + j].done);
        }
        if (flag) {
            this.bingo_lines++;
        }
        // 縦
        flag = true;
        for (let i = 0; i < this.size; i++) {
            flag && (flag = this.board[i * this.size + c].done);
        }
        if (flag) {
            this.bingo_lines++;
        }
        // 右下ななめ
        if (r == c) {
            flag = true;
            for (let i = 0; i < this.size; i++) {
                flag && (flag = this.board[i * this.size + i].done);
            }
            if (flag) {
                this.bingo_lines++;
            }
        }
        // 左下ななめ
        if ((r + c + 1) == this.size) {
            flag = true;
            for (let i = 0; i < this.size; i++) {
                flag && (flag = this.board[i * this.size + (this.size - 1 - i)].done);
            }
            if (flag) {
                this.bingo_lines++;
            }
        }
    }
    checkAllBingoLines() {
        // 全ての縦横斜めについてビンゴを計数する
        let bingo_lines = 0;
        for (let i = 0; i < this.size; i++) {
            let flag = true;
            for (let j = 0; j < this.size; j++) {
                flag && (flag = this.board[i * this.size + j].done);
            }
            if (flag) {
                bingo_lines++;
            }
        }
        for (let j = 0; j < this.size; j++) {
            let flag = true;
            for (let i = 0; i < this.size; i++) {
                flag && (flag = this.board[i * this.size + j].done);
            }
            if (flag) {
                bingo_lines++;
            }
        }
        let flag = true;
        for (let i = 0; i < this.size; i++) {
            flag && (flag = this.board[i * this.size + i].done);
        }
        if (flag) {
            bingo_lines++;
        }
        flag = true;
        for (let i = 0; i < this.size; i++) {
            flag && (flag = this.board[i * this.size + (this.size - 1 - i)].done);
        }
        if (flag) {
            bingo_lines++;
        }
        return bingo_lines;
    }
}
function shuffleArray(arr) {
    // 配列のランダム化を行う。
    // フィッシャーイェーツのアルゴリズムによる。
    let length = arr.length;
    for (let i = length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function render() {
    const grid = document.getElementById("bingo-grid");
    grid.innerHTML = "";
    // グリッドの列数を更新
    grid.style.gridTemplateColumns = `repeat(${bingo.size}, 1fr)`;
    // 各マスを描画
    bingo.board.forEach((cell, i) => {
        const div = document.createElement("div");
        div.className = "cell" + (cell.done ? " done" : "");
        if (cell.type) {
            div.classList.add(cell.type);
        }
        div.textContent = cell.name;
        div.addEventListener("click", () => {
            if (cell.name !== "FREE") {
                cell.done = !cell.done;
                saveProgress();
                render();
            }
        });
        grid.appendChild(div);
    });
    const status = document.getElementById("bingo-status");
    if (status) {
        status.textContent = `ビンゴ数: ${bingo.bingo_lines}` + (bingo.bingo_lines > 0 ? " 🎉" : "");
    }
}
function saveProgress() {
    // Bingoクラスをそのまま載せてる
    // いけるのか？
    // 多分ね、それぞれをばらして載せないとダメだと思う。
    localStorage.setItem("bingo-progress", bingo.toJSON());
}
function loadProgress() {
    const data = localStorage.getItem("bingo-progress");
    if (!data)
        return null;
    try {
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed.board))
            return null;
        return parsed;
    }
    catch (_a) {
        return null;
    }
}
let bingo = new Bingo("battle", [], 5, 0);
// let bingo: Bingo;
window.onload = () => {
    loadWeaponData().then(() => {
        const saved = loadProgress();
        if (saved) {
            Object.assign(bingo, saved);
            render();
        }
    });
};
