// ============================================
// SMOOTH SCROLLING & NAVIGATION
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
  });
}

// Navbar background on scroll
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(10, 14, 39, 0.98)';
    navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
  } else {
    navbar.style.background = 'rgba(10, 14, 39, 0.95)';
    navbar.style.boxShadow = 'none';
  }
});

// ============================================
// DEADLOCK DETECTION LOGIC
// ============================================
// Check if process i can finish
// let canProceed = true;
// for (let j = 0; j < m; j++) {
//   if (request[i][j] > work[j]) {  // Does process need more than available?
//     canProceed = false;            // NO, it can't proceed
//     break;
//   }
// }

// // If process can finish
// if (canProceed) {
//   work[j] += allocation[i][j];     // Free up its resources
//   finish[i] = true;                // Mark as finished
// }

// Event wiring
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
  card.style.animation = "fadeInUp 0.5s ease-out";

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
  if (!n || !m || n < 1 || m < 1) {
    alert("Please enter valid positive numbers for processes and resources.");
    return;
  }

  const container = document.getElementById("matrices");
  clearChildren(container);

  // create allocation and request tables (DOM)
  const allocCard = createMatrixTable(n, m, "alloc");
  const reqCard = createMatrixTable(n, m, "req");

  // append in order (left allocation, right request)
  container.appendChild(allocCard);
  container.appendChild(reqCard);

  // show detect button with animation
  const detectBtn = document.getElementById("detectBtn");
  detectBtn.style.display = "inline-block";
  detectBtn.style.animation = "fadeIn 0.5s ease-out";

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
    output.innerHTML = `<span style="color: #f5576c;">⚠️ Deadlock Detected!</span><br>
      <span style="color: #a8b2d1; font-size: 1rem;">Affected Processes: ${deadlocked
      .map((i) => "P" + i)
      .join(", ")}</span>`;
    output.style.background = 'rgba(245, 87, 108, 0.1)';
    output.style.border = '2px solid rgba(245, 87, 108, 0.3)';
    
    // image 
    const img = document.createElement("img");
    img.src = "./assets/3_Spiderman_Pointing_Meme_Template_V1.jpg";
    img.alt = "Deadlock Meme";
    img.style.animation = "fadeIn 0.5s ease-out";
    mediaDiv.appendChild(img);
  } else {
    output.innerHTML = `<span style="color: #4facfe;">✅ No Deadlock Detected!</span><br>
      <span style="color: #a8b2d1; font-size: 1rem;">All processes can proceed safely</span>`;
    output.style.background = 'rgba(79, 172, 254, 0.1)';
    output.style.border = '2px solid rgba(79, 172, 254, 0.3)';
    
    const vid = document.createElement("video");
    vid.src =
      "./assets/aura-farming-gif-indonesian-boat-racing-kid-iyyQ7IFOc6-video.mp4";
    vid.controls = true;
    vid.autoplay = true;
    vid.loop = true;
    vid.style.animation = "fadeIn 0.5s ease-out";
    mediaDiv.appendChild(vid);
  }
}

// Optional: initial setup on first load
window.addEventListener("DOMContentLoaded", () => {
  setupMatrixInputs();
  
  // Add intersection observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe sections for animations
  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(section);
  });
});

