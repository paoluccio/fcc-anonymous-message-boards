window.onload = () => {

  const mainContent = document.querySelector('.content');
  const boardsList = mainContent.querySelector('.content__boards-list');
  const modal = document.querySelector('.modal');
  const modalForm = document.forms[0];

  function renderBoards(boards) {
    if (boards.length) {
      boardsList.innerHTML = boards.map(board => `
        <li class="board">
          <a href="/${encodeURIComponent(board.board_name)}" class="board__title">${board.board_name}
            <div class="board__counters">
              <p>${board.threads_count === 1 ? `${board.threads_count} thread` : `${board.threads_count} threads`}</p>
              <p>${board.replies_count === 1 ? `${board.replies_count} reply` : `${board.replies_count} replies`}</p>
            </div>
          </a>
          <i class="far fa-trash-alt trash-bin-icon" title="Delete board" data-id="${board.id}"></i>
        </li>`).join('');
    } else {
      boardsList.innerHTML = '<p class="content__placeholder">No boards yet</p>';
    }
    fadeIn(mainContent);
  }

  function buildModalForm(action, id) {
    if (action === 'create') {
      modalForm.innerHTML = `
        <div class="modal-form__form-field">
          <label for="board">Board name*</label>
          <br>
          <input type="text" name="board" id="board" maxlength="30" pattern=".*\\S+.*" title="Required field" required">
        </div>
        <div class="modal-form__form-field">
          <label for="password">Owner password*</label>
          <br>
          <input type="text" name="password" id="password" maxlength="30" pattern=".*\\S+.*" title="Password of the owner is required" required>
        </div>
        <div class="modal-form__form-field">
          <input type="submit" class="modal-form__create-board" value="Create">
        </div>`;
    } else if (action === 'delete') {
      modalForm.innerHTML = `
        <div class="modal-form__form-field">
          <label for="password">Enter password*</label>
          <br>
          <input type="text" name="password" id="password" maxlength="30" pattern=".*\\S+.*" title="Password of the owner is required" required>
        </div>
        <div class="modal-form__form-field">
          <input type="submit" class="modal-form__delete-board" value="Delete" data-id="${id}">
        </div>`;
    }
    fadeIn(modal);
    modalForm.querySelector('input[type="text"]').focus();
  }

  function createBoard(e) {
    let { board, password } = modalForm;
    [board, password] = [board.value.trim(), password.value];
    // password.trim() guarantees that at least one character was used in password field
    if (board && password.trim()) {
      const createBtn = modalForm.querySelector('.modal-form__create-board');
      createBtn.disabled = true;
      e.preventDefault();
      fetch('/api/boards', {
          method: 'POST',
          body: JSON.stringify({ board, delete_password: password }),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(result => {
          if (result.error) {
            const wrongField = modalForm.querySelector('input[name="board"]');
            wrongField.focus();
            wrongField.select();
            createBtn.disabled = false;
            if (!modalForm.querySelector('.modal-form__error-msg')) {
              modalForm.lastElementChild.insertAdjacentHTML('beforebegin', `<p class="modal-form__error-msg">${result.error}</p>`);
            }
          } else {
            location = `/${encodeURIComponent(board)}`;
          }
        })
        .catch(err => console.log(err));
    }
  }

  function deleteBoard(e) {
    const password = modalForm.password.value;
    // Check first if password field is not completely empty or does not contain only spaces
    // but then, for verifying we will use the actual password without trimming  
    if (password && password.trim()) {
      const id = e.target.dataset.id;
      const deleteBtn = modalForm.querySelector('.modal-form__delete-board');
      deleteBtn.disabled = true;
      e.preventDefault();
      fetch('/api/boards', {
          method: 'DELETE',
          body: JSON.stringify({ _id: id, delete_password: password }),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            location.reload();
          } else {
            const wrongField = modalForm.querySelector('input[name="password"]');
            wrongField.focus();
            wrongField.select();
            deleteBtn.disabled = false;
            if (!modalForm.querySelector('.modal-form__error-msg')) {
              modalForm.firstElementChild.insertAdjacentHTML('afterend', `<p class="modal-form__error-msg">${result.error}</p>`);
            }
          }
        })
        .catch(err => console.log(err));
    }
  }

  function delegateModalEvents(e) {
    const target = e.target;
    if (target.matches('.modal')) {
      fadeOut(modal);
    } else if (target.matches('.modal-form__create-board')) {
      createBoard(e);
    } else if (target.matches('.modal-form__delete-board')) {
      deleteBoard(e);
    }
  }

  function delegateMainContentEvents(e) {
    const target = e.target;
    if (target.matches('.content__toggle-modal')) {
      buildModalForm('create', null)
    } else if (target.matches('.trash-bin-icon')) {
      buildModalForm('delete', target.dataset.id);
    }
  }

  // ********** Starting point **********
  function getBoards() {
    fetch('/api/boards')
      .then(response => response.json())
      .then(boards => renderBoards(boards))
      .catch(err => console.log(err));
  }

  getBoards();

  // ********** Event listeners **********
  mainContent.addEventListener('click', e => delegateMainContentEvents(e));
  modal.addEventListener('click', e => delegateModalEvents(e));
}