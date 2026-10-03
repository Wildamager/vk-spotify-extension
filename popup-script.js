const signInButton = document.getElementById('sign-in');

if (signInButton) {
    signInButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'login' });
    });
}