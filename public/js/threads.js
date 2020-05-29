window.onload = () => {

  // Encoded form of the string is used to form URL address correctly
  // for example when string contains special characters as '?', '&' and others
  const encodedBoard = location.pathname.slice(1);
  const decodedBoard = decodeURIComponent(encodedBoard);
  document.title = `${decodedBoard} | Anonymous Message Boards`;

  const navigation = document.querySelector('.content__navigation');
  navigation.innerHTML = `${navigation.innerHTML} / <a href="/${encodedBoard}">${decodedBoard}</a>`;

  const mainContent = document.querySelector('.content');
  const threadsList = mainContent.querySelector('.content__threads-list');
  const modal = document.querySelector('.modal');
  const modalForm = document.forms[0];

  function renderThreads(threads) {
    if (threads.length) {
      threadsList.innerHTML = threads.map(thread => `
      <li class="thread">
        <div class="thread__header">
          <a href="/${encodedBoard}/${encodeURIComponent(thread.thread_name)}/${thread._id}" class="thread__replies-page-link">${thread.thread_name}</a>
          <i class="far fa-angry angry-face-icon" title="Report on thread" data-id="${thread._id}"></i>
          <i class="far fa-trash-alt trash-bin-icon" title="Delete thread" data-id="${thread._id}"></i>
        </div>
        <ul class="thread__body">
          ${thread.replies.length ? `${thread.replies.map(reply => `
            <li class="recent-reply">
              <p class="recent-reply__text">${reply.reply_text}</p>
              <p class="recent-reply__timestamp">${moment(new Date(reply.created_on)).fromNow()}</p>
            </li>`).join('')}` : '<p class="thread__placeholder">No replies yet<i class="far fa-frown"></i></p>'}
        </ul>
        <div class="thread__footer">
          <p>Total of ${thread.replies_total === 1 ? `${thread.replies.length} reply` : `${thread.replies_total} replies`}</p>
        </div>
      </li>`).join('');
    } else {
      threadsList.innerHTML = '<p class="content__placeholder">No threads yet</p>';
    }
    fadeIn(mainContent);
  }

  function buildModalForm(action, id) {
    if (action === 'create') {
      modalForm.innerHTML = `
        <div class="modal-form__form-field">
          <label for="thread">Thread name*</label>
          <br>
          <input type="text" name="thread" id="thread" maxlength="40" pattern=".*\\S+.*" title="Required field" required>
        </div>
        <div class="modal-form__form-field">
          <label for="password">Owner password*</label>
          <br>
          <input type="text" name="password" id="password" maxlength="30" pattern=".*\\S+.*" title="Password of the owner is required" required>
        </div>
        <div class="modal-form__form-field">
          <input type="submit" class="modal-form__create-thread" value="Create">
        </div>`;
    } else if (action === 'delete') {
      modalForm.innerHTML = `
        <div class="modal-form__form-field">
          <label for="password">Enter password*</label>
          <br>
          <input type="text" name="password" id="password" maxlength="30" pattern=".*\\S+.*" title="Password of the owner is required" required>
        </div>
        <div class="modal-form__form-field">
          <input type="submit" class="modal-form__delete-thread" value="Delete" data-id="${id}">
        </div>`;
    } else if (action === 'report') {
      modalForm.innerHTML = `
        <p class="modal-form__dialogue">Are you sure you want to report on this thread?</p>
        <div class="modal-form__form-field">
          <input type="button" class="modal-form__report-yes" value="Yes" data-id="${id}">
          <input type="button" class="modal-form__report-no" value="No">
        </div>`;
    }
    fadeIn(modal);
    const firstInput = modalForm.querySelector('input[type="text"]');
    if (firstInput) firstInput.focus();
  }

  function createThread(e) {
    let { thread, password } = modalForm;
    [thread, password] = [thread.value.trim(), password.value];
    // password.trim() guarantees that at least one character was used in password field
    if (thread && password.trim()) {
      const createBtn = modalForm.querySelector('.modal-form__create-thread');
      createBtn.disabled = true;
      e.preventDefault();
      fetch(`/api/threads/${encodedBoard}`, {
          method: 'POST',
          body: JSON.stringify({ thread_name: thread, delete_password: password }),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(result => {
          if (result.error) {
            const wrongField = modalForm.querySelector('input[name="thread"]');
            wrongField.focus();
            wrongField.select();
            createBtn.disabled = false;
            if (!modalForm.querySelector('.modal-form__error-msg')) {
              modalForm.lastElementChild.insertAdjacentHTML('beforebegin', `<p class="modal-form__error-msg">${result.error}</p>`);
            }
          } else {
            location = `/${encodedBoard}/${encodeURIComponent(thread)}/${result._id}`;
          }
        })
        .catch(err => console.log(err));
    }
  }

  function deleteThread(e) {
    const password = modalForm.password.value;
    // Check first if password field is not completely empty or does not contain only spaces
    // but then, for verifying we will use the actual password without trimming  
    if (password && password.trim()) {
      const id = e.target.dataset.id;
      const deleteBtn = modalForm.querySelector('.modal-form__delete-thread');
      deleteBtn.disabled = true;
      e.preventDefault();
      fetch(`/api/threads/${encodedBoard}`, {
          method: 'DELETE',
          body: JSON.stringify({ thread_id: id, delete_password: password }),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(result => {
          if (result.error) {
            const wrongField = modalForm.querySelector('input[name="password"]');
            wrongField.focus();
            wrongField.select();
            deleteBtn.disabled = false;
            if (!modalForm.querySelector('.modal-form__error-msg')) {
              modalForm.firstElementChild.insertAdjacentHTML('afterend', `<p class="modal-form__error-msg">${result.error}</p>`);
            }
          } else {
            location.reload();
          }
        })
        .catch(err => console.log(err));
    }
  }

  function reportThread(e) {
    const id = e.target.dataset.id;
    modalForm.querySelectorAll('[type="button"]').forEach(button => button.disabled = true);
    fetch(`/api/threads/${encodedBoard}`, {
        method: 'PUT',
        body: JSON.stringify({ thread_id: id }),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(result => result.error ? console.log(result.error) : location.reload())
      .catch(err => console.log(err));
  }

  function delegateModalEvents(e) {
    const target = e.target;
    if (target.matches('.modal') || target.matches('.modal-form__report-no')) {
      fadeOut(modal);
    } else if (target.matches('.modal-form__create-thread')) {
      createThread(e);
    } else if (target.matches('.modal-form__delete-thread')) {
      deleteThread(e);
    } else if (target.matches('.modal-form__report-yes')) {
      reportThread(e);
    }
  }

  function delegateMainContentEvents(e) {
    const target = e.target;
    if (target.matches('.content__toggle-modal')) {
      buildModalForm('create', null)
    } else if (target.matches('.trash-bin-icon')) {
      buildModalForm('delete', target.dataset.id);
    } else if (target.matches('.angry-face-icon')) {
      buildModalForm('report', target.dataset.id);
    }
  }

  // ********** Starting point **********
  function getThreads() {
    fetch(`/api/threads/${encodedBoard}`)
      .then(response => response.json())
      .then(threads => renderThreads(threads))
      .catch(err => console.log(err));
  }

  getThreads();

  // ********** Event listeners **********
  mainContent.addEventListener('click', e => delegateMainContentEvents(e));
  modal.addEventListener('click', e => delegateModalEvents(e));
}