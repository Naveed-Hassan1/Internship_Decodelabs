const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
const taskItems = document.querySelectorAll('.task-list input');

menuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

taskItems.forEach((item) => {
  item.addEventListener('change', () => {
    const label = item.closest('li')?.querySelector('span');
    if (label) {
      label.classList.toggle('done', item.checked);
    }
  });
});
