/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router'
import { useTitle } from 'react-use'

import { getDetail, getCredit, getSimilarById } from '../services/movie'
import style from '../styles/Detail.module.css'

import { Code } from 'react-content-loader'
import {useSubscription, useMutation} from '@apollo/client'

import {addFavoriteQuery, addWatchlistQuery, getFavoriteByIdQuery, getWatchlistByIdQuery, removeFavoriteQuery, removeWatchlistQuery, getRatingQuery, addRatingQuery, updateRatingQuery, addReviewQuery, updateReviewQuery, getReviewByIdQuery, deleteReviewQuery} from '../services/graphqlQuery'
import {useSelector, useDispatch} from 'react-redux'
import { setPage } from '../reducers/pageReducer'
import _ from 'lodash'
import Swal from 'sweetalert2'
import { Redirect } from 'react-router'
import { getReview } from '../services/movie'
import { Link } from 'react-router-dom'
import Card from './Card'


export const Detail = () => {
  const user = useSelector(state => state.user)

  let {movieId} = useParams()
  const [movie, setMovie] = useState({})
  const [credits, setCredits] = useState({})
  //const img = poster ? `https://image.tmdb.org/t/p/w500${poster}` : noImage

  const {data, loading:favLoading} = useSubscription(getFavoriteByIdQuery, {variables: {id: user, id_movie: movieId}})
  const {data:watchList, loading:watchlistLoading} = useSubscription(getWatchlistByIdQuery, {variables: {id: user, id_movie: movieId}})
  const {data:dataRating, loading:ratingLoading} = useSubscription(getRatingQuery, {variables: {id_user: user, id_movie: movieId}})
  const {data: myReviewData, loading:reviewLoading} = useSubscription(getReviewByIdQuery, {variables: {id_user: user, id_movie: movieId}})


  const [addFavorite] = useMutation(addFavoriteQuery)
  const [removeFavorite] = useMutation(removeFavoriteQuery)
  const [addWatchlist] = useMutation(addWatchlistQuery)
  const [removeWatchlist] = useMutation(removeWatchlistQuery)
  const [addRating] = useMutation(addRatingQuery)
  const [updateRating] = useMutation(updateRatingQuery)
  const [addReview] = useMutation(addReviewQuery)
  const [updateReview] = useMutation(updateReviewQuery)
  const [deleteReview] = useMutation(deleteReviewQuery)

  const [checkFav, setCheckFav] = useState()
  const [checkWatchlist, setCheckWatchlist] = useState()
  const [rating, setRating] = useState('-')
  const [reviews, setReviews] = useState([])
  const [myReview, setMyReview] = useState([])
  const [similar, setSimilar] = useState()
  const [show, setShow] = useState('none')
  
  const dispatch = useDispatch()
  dispatch(setPage(''))

  useEffect(() => {
    setCheckFav(data?.fav_movie.length)
  }, [data])

  useEffect(() => {
    setCheckWatchlist(watchList?.watchlist.length)
  }, [watchList])

  useEffect(() => {
    setMyReview(myReviewData?.reviews[0]?.review)
  }, [myReviewData])

  useEffect(() => {
    const ratingCheck = dataRating?.ratings
    if(ratingCheck?.length > 0){
      setRating(ratingCheck[0].rating)
    } 
  }, [dataRating])

  useEffect(() => {
    getDetail(movieId).then(res => setMovie(res))
    getCredit(movieId).then(res => setCredits(res.crew))
    getReview(movieId).then(res => setReviews(res.results))
    getSimilarById(movieId).then(res => setSimilar(res.results))
  }, [])

  useTitle(movie.title ? movie.title : 'Loading')

  // If movie's data is not loaded, then return loader
  if(!movie.id){
    return <Code/>
  }

  const userInfo = {
    id_movie: movie.id,
    id_user: user
  }
  const director = credits[_.findKey(credits, ["job", "Director"])]?.name
  const screenplay = credits[_.findKey(credits, ["job", "Screenplay"])]?.name

  const date = movie?.release_date?.split("-")

  const loginFirst = text => {
    Swal.fire({
      text: `You must be login first before add this to your ${text}`,
      icon: "info",
      showCloseButton:true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Login'
    }).then((result) => {
      if (result.isConfirmed) {
        return <Redirect to="/login"/>
      }
    })
  }

  const handleFavorite = () => {
    if(user){
      if(!checkFav){
        addFavorite({variables: userInfo})
      }else{
        removeFavorite({variables: userInfo})
      }
    } else{
        loginFirst('favorite')
    }
  }
  
  const handleWatchlist = () => {
    if(user){
      if(!checkWatchlist){
        addWatchlist({variables: userInfo})
      } else{
        removeWatchlist({variables: userInfo})
      }
    } else{
      loginFirst('watchlist')
    }
  }

  const handleRating = () => {
    Swal.fire({
      title: 'Give your rating',
      input: 'range',
      inputLabel: 'Rating',
      inputAttributes: {
        min:0,
        max:10,
        step: 1
      },
      inputValue: rating === '-' ? 0 : rating 
    }).then(res => {
      if(res.isConfirmed){
        if(rating === '-'){
          addRating({variables: {...userInfo, rating:res.value} })
        } else{
          updateRating({variables: {...userInfo, rating: res.value}})
        }
      }
    })
  } 

  console.log(reviewLoading)

  const hanldeAddAndUpdateReview = e => {
    e.preventDefault()
    const review = e.target[0].value
    if(!myReview){
      addReview({variables: {...userInfo, review:review}})
    }else{
      updateReview({variables: {...userInfo, review:review}})
      setShow('none')
    }
  }

  const handleDeleteReview = e => {
    e.preventDefault()
    deleteReview({variables: userInfo})
  }

  const handleEdit = e => {
    e.preventDefault()
    setShow('block')
  }

  return (
    <div className={`${style.container} container`}>
      <div className={`row {style.detail}`}>
        <div className="col-sm-5">
          <img src={`https://image.tmdb.org/t/p/w500${movie?.poster_path}`} className={style.img} alt={movie.title}/>
        </div>
        <div className="col-sm-7">
          <h4><span className="fw-bold">{movie.title}</span><span className="fw-light"> ({date[0]})</span></h4>
          {movie.genres.map((genre,id) => <span key={id} className={style.genre}>{genre.name}</span>)}<br/>
          <span className={style.rating}>{movie.vote_average}/10</span>
          <div className="my-2">
            <b>Release Date</b><br/>
            {date[2]}/{date[1]}/{date[0]}
          </div>
          <div className="row w-100 my-3">
            <div className="col-sm">
              <b>Director</b><br/>
              {director}
            </div>
            <div className="col-sm">
              <b>Writer</b><br/>
              {screenplay}
            </div>
          </div>
          <div className="mb-1 row w-100">
            {favLoading && watchlistLoading && ratingLoading && <Code/>}
            {!favLoading && !watchlistLoading && !ratingLoading && 
              <>
                <div className="col-sm">
                  <b>Your Rating</b><br/>
                  <button className={`btn btn-dark mb-1 {style.ratingButton}`} onClick={handleRating}>
                    {rating}/10
                  </button>
                </div>
                <div className="col-sm">
                  <div className="mb-1">
                    <button className={`btn ${checkFav && 'btn-dark'} btn-danger`} onClick={handleFavorite}>
                      {checkFav > 0 && 'Added to Favorite'}
                      {checkFav === 0 && 'Add to Favorite'}
                    </button>
                  </div>
                  <div>
                    <button className={`btn ${checkWatchlist && 'btn-dark'} btn-primary`} onClick={handleWatchlist}>
                      {checkWatchlist > 0 && 'Added to Watchlist'}
                      {checkWatchlist === 0 && 'Add to Watchlist'}
                    </button>
                  </div>
                </div>
              </>
            }
          </div>

        </div>
      </div>

      <div className="w-100 border-dark border-3 p-3 border-top my-3">
        <h4 className="text-decoration-underline mb-3">User Reviews </h4>
        {reviewLoading && <Code/>}
        {!myReview && !reviewLoading && <>
          <u>Give your review</u>
          <form className="my-1" onSubmit={hanldeAddAndUpdateReview}>
            <textarea className={`${style.textArea} mb-3 form-control`}/>
            <button type="submit" className="btn btn-dark fs-6">Add Review</button>
          </form>
        </>}
        {myReview && !reviewLoading &&
          <div className={`form form-control my-2 ${style.review}`} >
            <b>Your Review</b> - {parseInt(rating)}/10<br/> 
            {myReview}<br/>
            <button className={`btn my-2 btn-info text-white`} onClick={handleEdit}>Edit</button>
            <button className="btn btn-danger mx-2" onClick={handleDeleteReview}>Delete</button>
            <form style={{display: show}} onSubmit={hanldeAddAndUpdateReview}>
              <textarea className={`${style.textArea} mb-3 form-control`} defaultValue={myReview}/>
              <button type="submit" className="btn btn-dark fs-6">Update Review</button>
            </form>
          </div>}


        {reviews?.slice(0, 2).map(review =>
          <div key={review.id} className={`form form-control my-2 ${style.review}`} >
            <b>{review.author_details.username}</b> | {review.author_details.rating ? parseInt(review.author_details.rating) : '-'}/10<br/> 
            {review.content}
          </div> 
        )}
        {reviews.length > 2 && <Link to="/reviews/:movieId">Click to See More Reviews</Link>}
      </div>

      <div className="border-dark border-3 p-3 border-top my-3">
        <h4 className="text-decoration-underline mb-3">Similar Movies</h4>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
            {similar?.map(movie => 
              <Card key={movie.id} id={movie.id} title={movie.title} name={movie.name} poster={movie.poster_path}/>  
            )}
        </div>
      </div>
    </div>
  )
}