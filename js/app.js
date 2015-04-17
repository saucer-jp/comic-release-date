$(function(){
  "use strict";



  // =========================
  // Classes
  // =========================

  // モデル

  // ------------------------
  // データ管理用クラス
  // ------------------------

  function Storage( STORAGEKEY, keywords ){
    this.storageKey = STORAGEKEY;
    this.keywords = keywords;
    this.load(); // アクセス時にローカルストレージからデータロード
  }

  Storage.prototype = {
    // prototypeのconstructor参照が消えないように
    'constructor': Storage,

    // ローカルストレージ
    'storage': window.localStorage,

    // ローカルストレージに保存されているデータを返す
    'load': function(){
      if( this.storage.length === 0 ) return; // ストレージが空なら終了
      this.keywords = JSON.parse( this.storage.getItem( this.storageKey ) );
    },

    // メモリ上のデータをローカルストレージに保存
    'save': function(){
      var key = this.storageKey;
      var val = JSON.stringify( this.keywords );
      this.storage.setItem( key, val );
    },

    // メモリ上のデータ配列をすべて返す
    'getKeywordsAll': function(){
      return this.keywords;
    },

    // 引数に与えられたkeywordをメモリ上のtype配列に追加、
    // その後ローカルストレージに保存
    'setKeyword': function( type, keyword ){
      console.log( keyword );
      if( this.keywords[ type ].indexOf( keyword ) >= 0 ) return; //重複確認。すでにキーワードが保存されていれば終了
      this.keywords[ type ].push( keyword ); // 値の追加
      this.save(); // ローカルストレージに保存
    },

    // 引数に与えられたkeywordをメモリ上のtype配列から削除、
    // その後ローカルストレージに保存
    'removeKeyword': function( type, keyword ){
      var index = this.keywords[ type ].indexOf( keyword );
      if( index === -1 ) return; //消すものなければ終了
      this.keywords[ type ].splice( index, 1 ); // 値の削除
      this.save(); // ローカルストレージに保存
    },

    // メモリ上のデータ配列に値があるかを調べてboolで返す
    'hasKeyword': function( type, keyword ){
      var index = this.keywords[ type ].indexOf( keyword );
      if( index === -1 ){ return false }
      else { return true }
    }
  };



  // ビューとコントローラー

  // ------------------------
  // 画面に表示されるお気に入りボタンクラス
  // ------------------------

  function Star( $cell, type, html, classNames, dataTypeNames ){
    this.$cell = $cell;
    this.type = type;
    this.$star = $( html.star ).clone( false );
    this.className = classNames.starButton;
    this.dataTypeNames = dataTypeNames;
    this.render();
    this.events();
  }

  Star.prototype = {
    // prototypeのconstructor参照が消えないように
    'constructor': Storage,

    // お気に入りボタンが設置されたセルの文字列を取得して返す
    // この時、管理に不要な巻数やサブタイトルなどは除去する
    'getKeyword': function( type ){
      var result = this.$cell.remove( '.' + this.className ).text();
      if( type === '01' ){ // 書名
        // 書名の正規表現は完全なタイトルを抽出するのではなく、大体合うレベル
        result = result.match( /\S+　?\S+　?/, '' ).toString(); // 漫画タイトルの先頭から全角スペース２つ分の文字を取得
        result = result.replace( /　[０-９]+.*$/, '' ); // 巻数とサブタイトルを削除
      }
      //else if( type === '02' ){ // 著者
        // 著者はそのままなので、連名の著者の場合は個人名にはヒットしなくなる
      //}
      return result;
    },

    // お気に入りボタンの属性値取得(bool)
    'getCondition': function(){
      var dataTypeName = 'data-' + this.dataTypeNames.favorite;
      return this.$star.get( 0 ).getAttribute( dataTypeName );
    },

    // お気に入りボタンの属性値を引数で書き換え(bool)
    'setCondition': function( condition ){
      var dataTypeName = 'data-' + this.dataTypeNames.favorite;
      this.$star.get( 0 ).setAttribute( dataTypeName, condition );
    },

    // お気に入りボタンの属性値をトグルして書き換え(bool)
    'toggleCondition': function(){
      var latestCondition = this.getCondition();
      var reversedCondition = latestCondition === 'true' ? false : true ;
      this.setCondition( reversedCondition ); // 属性値の書き換え
    },

    // 現在のお気に入り状態を取得(bool)
    'isFavorite': function(){
      var dataTypeName = 'data-' + this.dataTypeNames.favorite;
      return this.getCondition( this.$star, dataTypeName ) === 'true';
    },

    // 対象セルの親trに属性値(bool)を付与
    // お気に入りされていればtrue, そうじゃなければfalse
    // 属性値を見てCSSで塗り分け
    'paintHightlight': function(){
      var dataTypeName = 'data-' + this.dataTypeNames.hightlight + this.type;
      var condition = this.getCondition();
      this.$cell.parent().get( 0 ).setAttribute( dataTypeName, condition );
    },

    // お気に入りボタンのイベントを設置
    'events': function(){
      var that = this;
      // お気に入りボタンクリックで発火
      // クリックされたインスタンスのみが発火
      this.$star.closest('td').on('click', function(){
        var keyword = that.getKeyword( that.type );
        // お気に入りだったら、お気に入りはずす
        // ローカルストレージから値の削除
        if( that.isFavorite() ){
          storage.removeKeyword( that.type, keyword );
        }
        // お気に入りじゃなかったら、お気に入りにする
        // ローカルストレージに値の追加
        else {
          storage.setKeyword( that.type, keyword );
        }
        that.toggleCondition(); // 属性値を書き換え
      });

      // お気に入りボタンクリックで発火
      // ひとつのインスタンスがクリックされたら、すべてのインスタンスが発火
      $('.' + this.className ).closest('tbody').on('click', function(){
        that.render( true ); // お気に入り情報のリフレッシュ
      });
    },

    // お気に入りボタンをDOMに描画
    'render': function( refresh ){
      var lastCondition = storage.hasKeyword( this.type, this.getKeyword( this.type ) );
      // 引数がtrueだった場合は要素の設置は行わず
      // 属性値の更新だけを行う
      if( refresh === true ){
        this.setCondition( lastCondition ); // お気に入りボタンに現在のお気に入り状態付与
        this.paintHightlight(); // ハイライトの描画
      }
      else {
        this.setCondition( lastCondition ); // お気に入りボタンに現在のお気に入り状態付与
        this.$star.addClass( this.className ); // お気に入りボタンにクラス名付与
        this.$cell.prepend( this.$star ); // お気に入りボタンの設置
        this.paintHightlight(); // ハイライトの描画
      }
    }
  };



  // ------------------------
  // 表示をお気に入りだけに絞り込む機能
  // ------------------------

  function RefineHightLight( $table, $addTarget, html, classNames, dataTypeNames ){
    this.$table = $table;
    this.$addTarget = $addTarget;
    this.$button = $( html.refineButton ).clone( false );
    this.className = classNames.refineButton;
    this.dataTypeNames = dataTypeNames;
    this.render();
    this.events();
  }

  RefineHightLight.prototype = {
    // prototypeのconstructor参照が消えないように
    'constructor': RefineHightLight,

    // 絞り込みボタンの属性値取得(bool)
    'getCondition': function(){
      var dataTypeName = 'data-' + this.dataTypeNames.refine;
      return this.$table.get( 0 ).getAttribute( dataTypeName );
    },

    // 絞り込みボタンの属性値を引数で書き換え(bool)
    'setCondition': function( condition ){
      var dataTypeName = 'data-' + this.dataTypeNames.refine;
      this.$table.get( 0 ).setAttribute( dataTypeName, condition );
      this.$button.get( 0 ).setAttribute( dataTypeName, condition );
    },

    // 絞り込みボタンの属性値をトグルして書き換え(bool)
    'toggleCondition': function(){
      var latestCondition = this.getCondition();
      var reversedCondition = latestCondition === 'true' ? false : true ;
      this.setCondition( reversedCondition ); // 属性値の書き換え
    },

    // 絞り込みボタンのイベントを設置
    'events': function(){
      var that = this;
      this.$button.on('click', function(){
        that.toggleCondition(); // 属性値を書き換え
      });
    },

    // 絞り込みボタンをDOMに描画
    'render': function(){
      var lastCondition = false; // Storageクラスを汎用化できるまではfalse返す
      this.setCondition( lastCondition ); // tableに現在の絞り込みの可否を付与
      this.$button.addClass( this.className ); // 絞り込みボタンにクラス名付与
      this.$addTarget.prepend( this.$button ); // 絞り込みボタンの設置
    }
  };



  // =========================
  // functions
  // =========================
  // 引数のセルに漫画タイトルと著者のどちらが入っているか判定
  function _getTargetCellType( $cell, COMICTITLESCELL, AUTHORSCELL ){
    var className = $cell.attr('class');
    if( className === COMICTITLESCELL ){
      return '01'; // 書名
    }
    else if( className === AUTHORSCELL ){
      return '02'; // 著者
    }
  }



  // =========================
  // HTML
  // =========================
  var html = { // extentionが使うHTML
    'star': [ // ★ボタン
      '<span></span>'
    ].join(''),

    'refineButton': [ // お気に入りだけ表示ボタン
      '<span>',
        '<span>お気に入りだけ表示</span>',
        '<span>お気に入りだけ表示 解除</span>',
      '</span>'
    ].join('')
  };



  // =========================
  // classNames
  // =========================
  var prefix = 'CRD'; // 接頭辞 CRD = comic release date
  var classNames = { // extentionが使用するクラス名
    'starButton': [ prefix, 'starButton' ].join('-'),
    'refineButton': [ prefix, 'refineButton' ].join('-')
  };



  // =========================
  // dataTypeNames
  // =========================
  var dataTypeNames = { // 状態保存に使うデータ属性名
    'favorite': 'favorite', // お気に入りの状態
    'hightlight': 'hightlight', // ハイライトするかしないか
    'refine': 'refine' // お気に入りのみ表示してるかしてないか
  };



  // =========================
  // data
  // =========================
  var STORAGEKEY = 'keywords'; // ローカルストレージ保存用のキー
  var keywords = { // タイトルと著者保存用配列
    '01':[], // 書名
    '02':[]  // 著者
  };



  // =========================
  // target DOM at www.taiyosha.co.jp/comic/**
  // 太洋社サイトのクラス情報
  // =========================
  var REFINEBUTTONADDTARGET = '#sort_tab_detail'; // 表示日付の前半と後半を切り替えるリンク部分
  var TARGETTABLE = '#right_box .table_box_new_book'; // 対象となる領
  var COMICTITLESCELL = 'comic_2_b'; // 対象となるセル：漫画のタイトル
  var AUTHORSCELL = 'comic_1_b'; // 対象となるセル：著者
  var TARGETCELL = '.' + COMICTITLESCELL + ',.' + AUTHORSCELL;



  // =========================
  // action
  // =========================
  var storage = new Storage( STORAGEKEY, keywords );
  var refineHightLight = null;

  // 対象のすべてのセルに★を設置する
  var $targetTableCell = $( TARGETCELL, TARGETTABLE ); // キャッシュ
  var cellsLength = $targetTableCell.length - 1;

  $targetTableCell.get().forEach(function( element, index ){ // 高速化でやっているけどまだ遅い
    var $this = $( element );
    var type = _getTargetCellType( $this, COMICTITLESCELL, AUTHORSCELL );
    var star = new Star( $this, type, html, classNames, dataTypeNames );

    // すべてのセルに★ボタンを追加完了したら、
    // お気に入りだけを表示するためのボタンを設置
    if( cellsLength === index ){
      refineHightLight = new RefineHightLight(
        $( TARGETTABLE ), // お気に入りだけ表示のdata属性設置のためにつかう
        $( REFINEBUTTONADDTARGET ), // お気に入りだけ表示ボタンの設置先
        html, // ボタンのhtml
        classNames, // ボタンのクラス名
        dataTypeNames // お気に入りだけ表示のdata属性名
      );
    }
  });
});
