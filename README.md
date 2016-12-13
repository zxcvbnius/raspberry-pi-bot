# raspberry-pi-bot

This is a demo project for NCTU class. Showing students how to control Raspberry pi by using Android devices. 
[Demo](https://drive.google.com/open?id=0B_P53ILf1tA1ZjVOaVp3cHVQdDQ)


## Socket.io
In most cases the raspberry pi is assigned a private ip. If you want to communicate to raspberry pi directly, you have to ensure that your mobile phone is in the same network with pi or use nat traversal. In the demo project, I want to reduce complexity. Instead of sending commands to Raspberry pi, using [socket.io](http://socket.io/) as communication between raspberry pi and mobile device.



