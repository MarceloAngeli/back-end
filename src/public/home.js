document.addEventListener('DOMContentLoaded', () => {
    const mySelect = document.querySelector('select');
    const username = document.querySelector('body').dataset.my_username;
    const block_phrase = document.querySelector('#block-message');
    block_phrase.style.visibility = 'hidden';
   
    //Create an empty option
    const optionEmpty = new Option(' ', ' ')
    mySelect.add(optionEmpty)
    optionEmpty.dataset.status = 0;
    mySelect.value = optionEmpty.value;

    const messages = document.querySelectorAll('li');
    const deletes = document.querySelectorAll('i')

    messages.forEach((element) =>{
        element.style.display = 'none';
    })

    mySelect.addEventListener('change', () => {
        let actual_contact = mySelect.value;

        console.log(mySelect.options[mySelect.selectedIndex].dataset.status)
        if(mySelect.options[mySelect.selectedIndex].dataset.status != 0){    
            document.querySelector('#send-message-input').disabled = true;
            block_phrase.style.visibility = 'visible'
        }else{
            document.querySelector('#send-message-input').disabled = false;
            block_phrase.style.visibility = 'hidden';
        }

        messages.forEach(element => {
            const user1 = element.dataset.username1;
            const user2 = element.dataset.username2;

            if (actual_contact === user1 || actual_contact === user2) {
                element.style.display = 'list-item';
            } else {
                element.style.display = 'none';
            }

            if(element.dataset.send_by == 2){
                if(user2 === username){
                    element.style.color = 'green';
                }else{
                    element.style.color = 'red';
                }
            }

            if(element.dataset.send_by == 1){
                if(user1 === username){
                    element.style.color = 'green';
                }else{
                    element.style.color = 'red';
                }
            }
        });
    });
    deletes.forEach(element =>{
        element.addEventListener('click', async ()=> {
            const data = {
                message_id: element.dataset.id
            }

            element.parentElement.remove();
            const response = await fetch('http://localhost:3001/delete',{
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        })
    })

    const block = document.querySelector("#block")

    block.addEventListener('click', async () =>{
        const data = {
            username_blocked: mySelect.value
        }

        const response = await fetch('http://localhost:3001/block',{
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
    })})
});