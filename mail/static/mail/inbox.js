document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email("none"));

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector("#compose-form").addEventListener("submit", event => {
    event.preventDefault()
    submit_email()
  });

  document.addEventListener('click', event => {
    const element = event.target;
    if (element.className === "email-div-class") {
      get_email(element.getAttribute("data-email-id"))
    }
  });

  let archive_button = document.querySelector("#archive-button");
  archive_button.addEventListener("click", () => {
    archive_email(archive_button.getAttribute("data-email-id"), archive_button.getAttribute("data-archived"));
  })

  let reply_button = document.querySelector("#reply-button");
  reply_button.addEventListener("click", () => {
    let id  = reply_button.getAttribute("data-email-id");
    compose_email(id);
  })
});

function submit_email() {
  console.log(document.querySelector("#compose-body").value);
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: document.querySelector("#compose-recipients").value,
      subject: document.querySelector("#compose-subject").value,
      body: document.querySelector("#compose-body").value
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    load_mailbox('sent');
  })
}



function compose_email(status) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#each-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  if (status === "none") {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-subject').disabled = false;
    document.querySelector('#compose-body').value = '';
    console.log(status);
  } else {
    status = Number(status);
    fetch(`/emails/${status}`, {})
    .then(response => response.json())
    .then(result => {
      document.querySelector('#compose-recipients').value = `${result.sender}`;
      if (result.subject.substring(0,4) === "Re: ") {
        document.querySelector('#compose-subject').value = `${result.subject}`;
      } else {
        document.querySelector('#compose-subject').value = `Re: ${result.subject}`;
      }
      document.querySelector("#compose-subject").disabled = true;
      document.querySelector('#compose-body').value = `\n\n\nOn ${result.timestamp} ${result.sender} wrote:\n\n ${result.body}`;
    })
    
  }
  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#each-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(result => {
    console.log(result)
    const email_view = document.querySelector("#emails-view");
    result.forEach( res => {
      let email = document.createElement("div");
      email.style.border = "1px solid black";
      email.style.margin = "5px";
      email.style.padding = '5px';
      email.classList.add("email-div-class");
      if (res.read) {
        email.style.background = "#DFDFDD";
      } else {
        email.style.background = "white";
      }

      let date = document.createElement("p");
      date.textContent = `${res.timestamp}`;
      date.style.float = "right";

      let subject = document.createElement("b");
      if (res.subject) {
        subject.textContent = `${res.subject} \xa0`;
      } else {
        subject.textContent = `No subject \xa0`;
      }
      
      subject.style.fontWeight = "bold";
      subject.style.float = "left";

      let sender = document.createElement("p");
      sender.style.width = "50%";
      sender.classList.add("email-div-class");
      sender.setAttribute("data-email-id", `${res.id}`)
      sender.textContent = `${res.sender}`;
  
      email.append(date, subject, sender);
      email.setAttribute("data-email-id", `${res.id}`)

      email_view.appendChild(email);
    })
  })
}

function get_email(id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  const email_div = document.querySelector("#each-email");
  email_div.style.display = "block";
  id = Number(id);
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(result => {
    document.querySelector("#each-email-sender").innerHTML = `${result.sender}`;
    document.querySelector("#each-email-recipient").innerHTML = `${result.recipients}`;
    document.querySelector("#each-email-subject").innerHTML = `${result.subject}`;
    document.querySelector("#each-email-timestamp").innerHTML = `${result.timestamp}`;
    document.querySelector("#each-email-body").innerHTML = `${result.body}`;
    document.querySelector("#archive-button").setAttribute("data-email-id",  `${result.id}`);
    document.querySelector("#reply-button").setAttribute("data-email-id", `${result.id}`);


    let archive_button = document.querySelector("#archive-button");
    if (result.archived) {
      archive_button.textContent = "Unarchive";
      archive_button.setAttribute("data-archived", true);
    } else {
      archive_button.textContent = "Archive";
      archive_button.setAttribute("data-archived", false);
    }
  })


  .catch(error => {
    console.log(error)
  });

  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  });
}

function archive_email(id, archived) {
  id = Number(id);

  if (archived === "true") {
    fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        archived: false
      })
    })
    .then(() => {
      load_mailbox("inbox");
     })
    .catch(error => {
      console.log(error)
    });
  } else {
    fetch(`/emails/${id}`, {
      method: "PUT", 
      body: JSON.stringify({
        archived: true
      })
    })
    .then(() => {
      load_mailbox("inbox");
     })
    .catch(error => {
      console.log(error)
    });
  }
}