// event wiring
document
  .getElementById("setupBtn")
  .addEventListener("click", setupMatrixInputs);
document.getElementById("detectBtn").addEventListener("click", detectDeadlock);

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function createMatrixTable(n, m, idPrefix) {
  // returns <div class="matrix-card"> which contains title + table
  const card = document.createElement("div");
  card.className = "matrix-card";

  const title = document.createElement("div");
  title.className = "matrix-title";
  title.textContent = idPrefix.startsWith("alloc")
    ? "Allocation Matrix"
    : "Request Matrix";
  card.appendChild(title);

  const tbl = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  // blank corner header
  const corner = document.createElement("th");
  corner.textContent = "";
  headRow.appendChild(corner);

  for (let j = 0; j < m; j++) {
    const th = document.createElement("th");
    th.textContent = "Res" + j;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  tbl.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (let i = 0; i < n; i++) {
    const tr = document.createElement("tr");
    const rowHeader = document.createElement("th");
    rowHeader.textContent = "P" + i;
    tr.appendChild(rowHeader);

    for (let j = 0; j < m; j++) {
      const td = document.createElement("td");
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.value = "0";
      inp.className = "matrix-input";
      inp.id = `${idPrefix}_${i}_${j}`;
      // accessibility label
      inp.setAttribute("aria-label", `${idPrefix} process ${i} resource ${j}`);
      td.appendChild(inp);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  tbl.appendChild(tbody);
  card.appendChild(tbl);
  return card;
}

function setupMatrixInputs() {
  const n = +document.getElementById("numProc").value;
  const m = +document.getElementById("numRes").value;
  if (!n || !m || n < 1 || m < 1) return;

  const container = document.getElementById("matrices");
  clearChildren(container);

  // create allocation and request tables (DOM)
  const allocCard = createMatrixTable(n, m, "alloc");
  const reqCard = createMatrixTable(n, m, "req");

  // append in order (left allocation, right request)
  container.appendChild(allocCard);
  container.appendChild(reqCard);

  // show detect button
  document.getElementById("detectBtn").style.display = "inline-block";

  // clear outputs
  document.getElementById("output").textContent = "";
  document.getElementById("mediaOutput").innerHTML = "";
}

function buildWaitForGraph(n, m, allocation, request) {
  const graph = {};
  for (let i = 0; i < n; i++) {
    graph[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      let needsResource = false;
      for (let k = 0; k < m; k++) {
        if (request[i][k] > 0 && allocation[j][k] > 0) {
          needsResource = true;
          break;
        }
      }
      if (needsResource) graph[i].push(j);
    }
  }
  return graph;
}

function detectCycle(graph, n) {
  const visited = new Array(n).fill(false);
  const recStack = new Array(n).fill(false);
  let cycleNodes = [];

  function dfs(v) {
    visited[v] = true;
    recStack[v] = true;
    for (const neighbor of graph[v]) {
      if (!visited[neighbor]) {
        if (dfs(neighbor)) {
          cycleNodes.push(neighbor);
          return true;
        }
      } else if (recStack[neighbor]) {
        cycleNodes.push(neighbor);
        return true;
      }
    }
    recStack[v] = false;
    return false;
  }

  for (let i = 0; i < n; i++) {
    cycleNodes = [];
    if (!visited[i] && dfs(i)) {
      cycleNodes.push(i);
      return Array.from(new Set(cycleNodes)).reverse();
    }
  }
  return [];
}

function detectDeadlock() {
  const n = +document.getElementById("numProc").value;
  const m = +document.getElementById("numRes").value;
  if (!n || !m) return;

  const allocation = [];
  const request = [];

  for (let i = 0; i < n; i++) {
    allocation[i] = [];
    request[i] = [];
    for (let j = 0; j < m; j++) {
      const allocEl = document.getElementById(`alloc_${i}_${j}`);
      const reqEl = document.getElementById(`req_${i}_${j}`);
      allocation[i][j] = allocEl ? +allocEl.value || 0 : 0;
      request[i][j] = reqEl ? +reqEl.value || 0 : 0;
    }
  }

  const graph = buildWaitForGraph(n, m, allocation, request);
  const deadlocked = detectCycle(graph, n);

  const output = document.getElementById("output");
  const mediaDiv = document.getElementById("mediaOutput");
  output.textContent = "";
  mediaDiv.innerHTML = "";

  if (deadlocked.length > 0) {
    output.innerHTML = `Deadlock detected among processes: ${deadlocked
      .map((i) => "P" + i)
      .join(", ")}`;
    // image (make sure file exists or replace path)
    const img = document.createElement("img");
    img.src = "./assets/3_Spiderman_Pointing_Meme_Template_V1.jpg";
    img.alt = "Deadlock Meme";
    mediaDiv.appendChild(img);
  } else {
    output.innerHTML = `No Deadlock Detected!`;
    const vid = document.createElement("video");
    vid.src =
      "./assets/aura-farming-gif-indonesian-boat-racing-kid-iyyQ7IFOc6-video.mp4";
    vid.controls = true;
    vid.autoplay = true;
    vid.loop = true;
    mediaDiv.appendChild(vid);
  }
}

// Optional: initial setup on first load
window.addEventListener("DOMContentLoaded", () => {
  setupMatrixInputs();
});
