from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Gautam%401@localhost:5432/Diary_User'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy()
db.init_app(app)

class Diary(db.Model):
    date=db.Column(db.Date, primary_key=True)
    content=db.Column(db.Text, nullable=False)

@app.route('/add_diary', methods=['POST'])
def add_diary():
    data=request.get_json()
    try:
        diary_entry = Diary(
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            content=data['content']
        )
        existing_entry=Diary.query.get(diary_entry.date)
        if existing_entry:
            existing_entry.content = diary_entry.content
        else:
            db.session.add(diary_entry)
        db.session.commit()
        return jsonify({'message':'Diary entry added successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message':'Error adding diary entry!','error':str(e)}), 500
    
@app.route('/get_diary', methods=["GET"])
def get_entries():
    entries=Diary.query.all()
    result=[{'date':entry.date.strftime('%Y-%m-%d'), 'content':entry.content} for entry in entries]
    return jsonify(result), 200
    
with app.app_context():
    db.create_all()

if __name__=='__main__':
    app.run(debug=True, port=5000)