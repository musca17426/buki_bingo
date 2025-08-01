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
let allWeapons = [];
let board = [];
function loadWeaponData() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch("./data/weapon_v10.json");
        allWeapons = yield res.json();
        // 完了後に generateBingo を呼べるように
        const button = document.getElementById("generate-button");
        button.disabled = false;
    });
}
function generateBingo() {
    // UIからモードとサイズを取得
    const mode = document.getElementById("mode-select").value;
    const size = parseInt(document.getElementById("size-select").value, 10);
    const cellCount = size * size;
    // 指定モードの武器一覧を取得
    const candidates = allWeapons.filter(w => w.modes.includes(mode));
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    // 武器リストをボードに割り当て（不足なら FREE で補充）
    const selectedWeapons = shuffled.slice(0, cellCount).map(w => ({
        name: w.name,
        done: false,
    }));
    while (selectedWeapons.length < cellCount) {
        selectedWeapons.push({ name: "FREE", done: true });
    }
    // もう一度シャッフルして配置
    board = selectedWeapons.sort(() => Math.random() - 0.5);
    saveProgress();
    // 描画
    render(size);
}
function countBingoLines(board, size) {
    const get = (row, col) => board[row * size + col].done;
    let count = 0;
    // 横列チェック
    for (let r = 0; r < size; r++) {
        if ([...Array(size)].every((_, c) => get(r, c))) {
            count++;
        }
    }
    // 縦列チェック
    for (let c = 0; c < size; c++) {
        if ([...Array(size)].every((_, r) => get(r, c))) {
            count++;
        }
    }
    // 斜め（左上→右下）
    if ([...Array(size)].every((_, i) => get(i, i))) {
        count++;
    }
    // 斜め（右上→左下）
    if ([...Array(size)].every((_, i) => get(i, size - 1 - i))) {
        count++;
    }
    return count;
}
function render(size) {
    const grid = document.getElementById("bingo-grid");
    grid.innerHTML = ""; // 既存のマスを削除
    // グリッドの列数を更新（CSS）
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    // 各マスを描画
    board.forEach((cell, i) => {
        const div = document.createElement("div");
        div.className = "cell" + (cell.done ? " done" : "");
        div.textContent = cell.name;
        div.addEventListener("click", () => {
            if (cell.name !== "FREE") {
                cell.done = !cell.done;
                saveProgress();
                render(size); // 再描画（状態更新）
            }
        });
        grid.appendChild(div);
    });
    // ✅ ビンゴ数を数えて表示
    const bingoCount = countBingoLines(board, size);
    const status = document.getElementById("bingo-status");
    if (status) {
        status.textContent = `ビンゴ数: ${bingoCount}` + (bingoCount > 0 ? " 🎉" : "");
    }
}
function saveProgress() {
    const saveData = {
        board,
        size: Math.sqrt(board.length),
    };
    localStorage.setItem("bingo-progress", JSON.stringify(saveData));
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
window.onload = () => {
    loadWeaponData().then(() => {
        const saved = loadProgress();
        if (saved) {
            board = saved.board;
            render(saved.size);
        }
    });
};
// ✅ HTMLから呼べるようにする
window.generateBingo = generateBingo;
