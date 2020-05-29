window.onload = () => {

  // Encoded form of the string is used to form URL address correctly
  // for example when string contains special characters as '?', '&' and others
  const [encodedBoard, encodedThread, threadId] = location.pathname.slice(1).split('/');
  const [decodedBoard, decodedThread] = [decodeURIComponent(encodedBoard), decodeURIComponent(encodedThread)];
  document.title = `${decodedThread} | ${decodedBoard} | Anonymous Message Boards`;

  const navigation = document.querySelector('.content__navigation');
  navigation.innerHTML = `
    ${navigation.innerHTML} / 
    <a href="/${encodedBoard}">${decodedBoard}</a> / 
    <a href="/${encodedBoard}/${encodedThread}/${threadId}">${decodedThread}</a>`;

  const mainContent = document.querySelector('.content');
  const repliesList = mainContent.querySelector('.content__replies-list');
  const modal = document.querySelector('.modal');
  const modalForm = document.forms[0];

  function renderReplies(replies) {
    if (replies.length) {
      repliesList.innerHTML = replies.map(reply => `
        <li class="reply">
          <div class="reply__details">
            <p class="reply__timestamp">${moment(new Date(reply.created_on)).fromNow()}</p>
            <i class="far fa-angry angry-face-icon" title="Report on reply" data-id="${reply._id}"></i>
            <i class="far fa-trash-alt trash-bin-icon" title="Delete reply" data-id="${reply._id}"></i>
          </div>
          <div class="reply__text">
            <p>${reply.reply_text}</p>
          </div>
        </li>`).join('');
    } else {
      repliesList.innerHTML = '<p class="content__placeholder">No replies yet</p>';
    }
    fadeIn(mainContent);
  }

  function buildModalForm(action, id) {
    if (action === 'create') {
      modalForm.innerHTML = `
        <div class="modal-form__form-field">
          <label for="reply">Reply Text*</label>
          <br>
          <input type="text" name="reply" id="reply" pattern=".*\\S+.*" title="Required field" required>
        </div>
        <div class="modal-form__form-field">
          <label for="password">Owner password*</label>
          <br>
          <input type="text" name="password" id="password" maxlength="30" pattern=".*\\S+.*" title="Password of the owner is required" required>
        </div>
        <div class="modal-form__form-field">
          <input type="submit" class="modal-form__create-reply" value="Create">
        </div>`;
    } else if (action === 'delete') {
      modalForm.innerHTML = `
        <div class="modal-form__form-field">
          <label for="password">Enter password*</label>
          <br>
          <input type="text" name="password" id="password" maxlength="30" pattern=".*\\S+.*" title="Password of the owner is required" required>
        </div>
        <div class="modal-form__form-field">
          <input type="submit" class="modal-form__delete-reply" value="Delete" data-id="${id}">
        </div>`;
    } else if (action === 'report') {
      modalForm.innerHTML = `
        <p class="modal-form__dialogue">Are you sure you want to report on this reply?</p>
        <div class="modal-form__form-field">
          <input type="button" class="modal-form__report-yes" value="Yes" data-id="${id}">
          <input type="button" class="modal-form__report-no" value="No">
        </div>`;
    }
    fadeIn(modal);
    const firstInput = modalForm.querySelector('input[type="text"]');
    if (firstInput) firstInput.focus();
  }

  function createReply(e) {
    let { reply, password } = modalForm;
    [reply, password] = [reply.value.trim(), password.value];
    // password.trim() guarantees that at least one character was used in password field
    if (reply && password.trim()) {
      const createBtn = modalForm.querySelector('.modal-form__create-reply');
      createBtn.disabled = true;
      e.preventDefault();
      fetch(`/api/replies/${encodedBoard}`, {
          method: 'POST',
          body: JSON.stringify({ thread_id: threadId, reply_text: reply, delete_password: password }),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(result => {
          if (result.error) {
            const wrongField = modalForm.querySelector('input[name="reply"]');
            wrongField.focus();
            wrongField.select();
            createBtn.disabled = false;
            if (!modalForm.querySelector('.modal-form__error-msg')) {
              modalForm.lastElementChild.insertAdjacentHTML('beforebegin', `<p class="modal-form__error-msg">${result.error}</p>`);
            }
          } else {
            location.reload();
          }
        })
        .catch(err => console.log(err));
    }
  }

  function deleteReply(e) {
    const password = modalForm.password.value;
    // Check first if password field is not completely empty or does not contain only spaces
    // but then, for verifying we will use the actual password without trimming  
    if (password && password.trim()) {
      const id = e.target.dataset.id;
      const deleteBtn = modalForm.querySelector('.modal-form__delete-reply');
      deleteBtn.disabled = true;
      e.preventDefault();
      fetch(`/api/replies/${encodedBoard}`, {
          method: 'DELETE',
          body: JSON.stringify({ thread_id: threadId, reply_id: id, delete_password: password }),
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

  function reportReply(e) {
    const id = e.target.dataset.id;
    modalForm.querySelectorAll('[type="button"]').forEach(button => button.disabled = true);
    fetch(`/api/replies/${encodedBoard}`, {
        method: 'PUT',
        body: JSON.stringify({ thread_id: threadId, reply_id: id }),
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
    } else if (target.matches('.modal-form__create-reply')) {
      createReply(e);
    } else if (target.matches('.modal-form__delete-reply')) {
      deleteReply(e);
    } else if (target.matches('.modal-form__report-yes')) {
      reportReply(e);
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
  function getReplies() {
    fetch(`/api/replies/${encodedBoard}?thread_id=${threadId}`)
      .then(response => response.json())
      .then(threads => renderReplies(threads))
      .catch(err => console.log(err));
  }

  getReplies();

  // ********** Event listeners **********
  mainContent.addEventListener('click', e => delegateMainContentEvents(e));
  modal.addEventListener('click', e => delegateModalEvents(e));
}